import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import {
  Camera as CameraIcon,
  Check,
  Crop,
  Image as ImageIcon,
  Minus,
  Plus,
  RotateCw,
  X,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useApp } from "@/providers/AppProvider";
import { getTheme } from "@/constants/colors";
import { tapHeavy, tapLight } from "@/lib/haptics";

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.5;

type SelectedImage = {
  uri: string;
  width: number;
  height: number;
};

type Size = {
  width: number;
  height: number;
};

type Offset = {
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBaseScale(image: SelectedImage, frame: Size): number {
  if (image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) return 1;
  return Math.max(frame.width / image.width, frame.height / image.height);
}

export default function CameraScreen() {
  const router = useRouter();
  const { profile } = useApp();
  const theme = getTheme(profile.theme);

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [cropFrame, setCropFrame] = useState<Size>({ width: 0, height: 0 });
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [busy, setBusy] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const btnAnim = useRef(new Animated.Value(1)).current;
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const dragStartRef = useRef<Offset>({ x: 0, y: 0 });

  const resetCropControls = useCallback((): void => {
    offsetRef.current = { x: 0, y: 0 };
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setPreviewError(null);
  }, []);

  const handlePickedAsset = useCallback((asset: ImagePicker.ImagePickerAsset): void => {
    setSelectedImage({
      uri: asset.uri,
      width: asset.width ?? 1200,
      height: asset.height ?? 900,
    });
    setNotice(null);
    resetCropControls();
  }, [resetCropControls]);

  const clampOffset = useCallback((nextOffset: Offset, nextZoom: number = zoom): Offset => {
    if (!selectedImage || cropFrame.width <= 0 || cropFrame.height <= 0) {
      return { x: 0, y: 0 };
    }

    const baseScale = getBaseScale(selectedImage, cropFrame);
    const displayWidth = selectedImage.width * baseScale * nextZoom;
    const displayHeight = selectedImage.height * baseScale * nextZoom;
    const maxX = Math.max(0, (displayWidth - cropFrame.width) / 2);
    const maxY = Math.max(0, (displayHeight - cropFrame.height) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
  }, [cropFrame, selectedImage, zoom]);

  const updateOffset = useCallback((nextOffset: Offset, nextZoom: number = zoom): void => {
    const clamped = clampOffset(nextOffset, nextZoom);
    offsetRef.current = clamped;
    setOffset(clamped);
  }, [clampOffset, zoom]);

  useEffect(() => {
    updateOffset(offsetRef.current, zoom);
  }, [cropFrame.height, cropFrame.width, selectedImage?.uri, updateOffset, zoom]);

  useEffect(() => {
    let mounted = true;
    ImagePicker.getPendingResultAsync()
      .then((pending) => {
        if (!mounted || !pending || "code" in pending || pending.canceled || !pending.assets?.[0]) return;
        handlePickedAsset(pending.assets[0]);
      })
      .catch((error: unknown) => {
        console.log("[camera] pending picker result error", error);
      });

    return () => {
      mounted = false;
    };
  }, [handlePickedAsset]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => Boolean(selectedImage),
    onMoveShouldSetPanResponder: (_event, gestureState) => Boolean(selectedImage) && (Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2),
    onPanResponderGrant: () => {
      dragStartRef.current = offsetRef.current;
    },
    onPanResponderMove: (_event, gestureState) => {
      updateOffset({
        x: dragStartRef.current.x + gestureState.dx,
        y: dragStartRef.current.y + gestureState.dy,
      });
    },
  }), [selectedImage, updateOffset]);

  const previewImageLayout = useMemo(() => {
    if (!selectedImage || cropFrame.width <= 0 || cropFrame.height <= 0) return null;
    const baseScale = getBaseScale(selectedImage, cropFrame);
    const displayWidth = selectedImage.width * baseScale * zoom;
    const displayHeight = selectedImage.height * baseScale * zoom;

    return {
      width: displayWidth,
      height: displayHeight,
      left: (cropFrame.width - displayWidth) / 2,
      top: (cropFrame.height - displayHeight) / 2,
      transform: [{ translateX: offset.x }, { translateY: offset.y }],
    };
  }, [cropFrame, offset.x, offset.y, selectedImage, zoom]);

  const animatePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();
  }, [btnAnim]);

  const handleClose = useCallback(() => {
    tapLight();
    router.back();
  }, [router]);

  const handleFrameLayout = useCallback((event: LayoutChangeEvent): void => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setCropFrame((current) => (
      current.width === nextWidth && current.height === nextHeight
        ? current
        : { width: nextWidth, height: nextHeight }
    ));
  }, []);

  const handleTakePhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    tapHeavy();
    animatePress();
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setNotice("Camera access is off. Enable it in Settings, or upload a bed photo from your gallery.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.95,
      });
      if (!result.canceled && result.assets[0]) {
        handlePickedAsset(result.assets[0]);
      }
    } catch (error) {
      console.log("[camera] take photo error", error);
      setNotice("We couldn't open the camera. Try again, or upload from your gallery.");
    } finally {
      setBusy(false);
    }
  }, [animatePress, busy, handlePickedAsset]);

  const handlePickLibrary = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    tapLight();
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setNotice("Photo library access is off. Enable it in Settings to upload an existing bed photo.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.95,
      });
      if (!result.canceled && result.assets[0]) {
        handlePickedAsset(result.assets[0]);
      }
    } catch (error) {
      console.log("[camera] pick library error", error);
      setNotice("We couldn't open your gallery. Please try again.");
    } finally {
      setBusy(false);
    }
  }, [busy, handlePickedAsset]);

  const handleRetake = useCallback(() => {
    tapLight();
    setSelectedImage(null);
    resetCropControls();
  }, [resetCropControls]);

  const handleZoom = useCallback((direction: "in" | "out"): void => {
    tapLight();
    const step = direction === "in" ? 0.18 : -0.18;
    const nextZoom = clamp(Number((zoom + step).toFixed(2)), MIN_ZOOM, MAX_ZOOM);
    setZoom(nextZoom);
    updateOffset(offsetRef.current, nextZoom);
  }, [updateOffset, zoom]);

  const handleRotate = useCallback(async (): Promise<void> => {
    if (!selectedImage || busy) return;
    setBusy(true);
    tapLight();
    try {
      const rotated = await ImageManipulator.manipulateAsync(
        selectedImage.uri,
        [{ rotate: 90 }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      setSelectedImage({ uri: rotated.uri, width: rotated.width, height: rotated.height });
      resetCropControls();
    } catch (error) {
      console.log("[camera] rotate error", error);
      setPreviewError("Could not rotate this photo. You can still analyze it as-is.");
    } finally {
      setBusy(false);
    }
  }, [busy, resetCropControls, selectedImage]);

  const cropImageForAnalysis = useCallback(async (): Promise<string> => {
    if (!selectedImage) throw new Error("NO_IMAGE_SELECTED");
    if (cropFrame.width <= 0 || cropFrame.height <= 0) return selectedImage.uri;

    const baseScale = getBaseScale(selectedImage, cropFrame);
    const imageScale = baseScale * zoom;
    const displayWidth = selectedImage.width * imageScale;
    const displayHeight = selectedImage.height * imageScale;
    const imageLeft = (cropFrame.width - displayWidth) / 2 + offsetRef.current.x;
    const imageTop = (cropFrame.height - displayHeight) / 2 + offsetRef.current.y;

    const originX = clamp((0 - imageLeft) / imageScale, 0, selectedImage.width - 1);
    const originY = clamp((0 - imageTop) / imageScale, 0, selectedImage.height - 1);
    const cropWidth = clamp(cropFrame.width / imageScale, 1, selectedImage.width - originX);
    const cropHeight = clamp(cropFrame.height / imageScale, 1, selectedImage.height - originY);

    const safeOriginX = Math.round(originX);
    const safeOriginY = Math.round(originY);
    const safeWidth = Math.max(1, Math.min(selectedImage.width - safeOriginX, Math.round(cropWidth)));
    const safeHeight = Math.max(1, Math.min(selectedImage.height - safeOriginY, Math.round(cropHeight)));

    const cropped = await ImageManipulator.manipulateAsync(
      selectedImage.uri,
      [{ crop: { originX: safeOriginX, originY: safeOriginY, width: safeWidth, height: safeHeight } }],
      { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
    );

    return cropped.uri;
  }, [cropFrame, selectedImage, zoom]);

  const handleConfirm = useCallback(async (): Promise<void> => {
    if (!selectedImage || busy) return;
    setBusy(true);
    setPreviewError(null);
    tapLight();
    try {
      const finalUri = await cropImageForAnalysis();
      router.replace({ pathname: "/(tabs)/(home)/result", params: { imageUri: finalUri } });
    } catch (error) {
      console.log("[camera] crop/confirm error", error);
      setPreviewError("We couldn't prepare that crop. Please retake the photo or choose another one.");
      setBusy(false);
    }
  }, [busy, cropImageForAnalysis, router, selectedImage]);

  if (selectedImage) {
    return (
      <View style={[styles.fill, { backgroundColor: "#080A16" }]}> 
        <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
          <View style={styles.topBar}>
            <Pressable onPress={handleRetake} style={styles.iconBtn} hitSlop={12} disabled={busy}>
              <X size={22} color="#FFF" />
            </Pressable>
            <Text style={styles.topTitle}>Confirm your bed photo</Text>
            <Pressable onPress={handleRotate} style={styles.iconBtn} hitSlop={12} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#FFF" /> : <RotateCw size={20} color="#FFF" />}
            </Pressable>
          </View>

          <View style={styles.previewContent}>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>Make sure the bed is clear</Text>
              <Text style={styles.previewBody}>Drag and zoom the photo so the AI sees the bed, pillows, and blanket edges.</Text>
            </View>

            <View
              style={styles.previewFrame}
              onLayout={handleFrameLayout}
              {...panResponder.panHandlers}
              testID="photo-preview-frame"
            >
              {previewImageLayout ? (
                <Image
                  source={{ uri: selectedImage.uri }}
                  style={[styles.previewImage, previewImageLayout]}
                  resizeMode="cover"
                  onError={() => setPreviewError("This preview couldn't load. Please retake or choose another image.")}
                  testID="captured-photo-preview"
                />
              ) : null}
              <View pointerEvents="none" style={styles.gridOverlay}>
                <View style={styles.gridVertical} />
                <View style={[styles.gridVertical, { left: "66.66%" }]} />
                <View style={styles.gridHorizontal} />
                <View style={[styles.gridHorizontal, { top: "66.66%" }]} />
              </View>
              {busy ? (
                <View style={styles.previewBusyOverlay}>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.previewBusyText}>Preparing photo…</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.adjustPanel}>
              <View style={styles.adjustHeader}>
                <Crop size={16} color="#FFD7C2" />
                <Text style={styles.adjustTitle}>Crop & adjust before analysis</Text>
              </View>
              <View style={styles.adjustRow}>
                <AdjustButton label="Rotate" onPress={handleRotate} disabled={busy}>
                  <RotateCw size={17} color="#FFF" />
                </AdjustButton>
                <AdjustButton label="Zoom out" onPress={() => handleZoom("out")} disabled={busy || zoom <= MIN_ZOOM}>
                  <Minus size={17} color="#FFF" />
                </AdjustButton>
                <AdjustButton label="Zoom in" onPress={() => handleZoom("in")} disabled={busy || zoom >= MAX_ZOOM}>
                  <Plus size={17} color="#FFF" />
                </AdjustButton>
                <AdjustButton label="Reset" onPress={resetCropControls} disabled={busy}>
                  <X size={16} color="#FFF" />
                </AdjustButton>
              </View>
            </View>

            {previewError ? <Text style={styles.previewError}>{previewError}</Text> : null}
          </View>

          <View style={styles.confirmRow}>
            <Pressable onPress={handleRetake} disabled={busy} style={[styles.confirmBtn, styles.confirmBtnGhost]}>
              <RotateCw size={18} color="#FFF" />
              <Text style={styles.confirmBtnTextGhost}>Retake</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={busy}
              style={({ pressed }) => [
                styles.confirmBtn,
                { backgroundColor: theme.accent, opacity: busy ? 0.65 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
              testID="analyze-photo-button"
            >
              <Text style={styles.confirmBtnText}>Analyze my vibe</Text>
              <Check size={18} color="#FFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: "#0E1024" }]}> 
      <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <Pressable onPress={handleClose} style={styles.iconBtn} hitSlop={12}>
            <X size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.topTitle}>Add your bed photo</Text>
          <View style={styles.iconBtn} />
        </View>

        <View style={styles.heroArea}>
          <View style={styles.bedIllustration}>
            <View style={styles.bedFrame}>
              <View style={styles.bedPillow} />
              <View style={[styles.bedPillow, { right: 20 }]} />
              <View style={styles.bedSheet} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Show us your bed</Text>
          <Text style={styles.heroBody}>
            Snap a fresh photo or pick one from your gallery. You’ll preview, crop, and approve it before AI scoring starts.
          </Text>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </View>

        <View style={styles.actionsArea}>
          <Animated.View style={{ transform: [{ scale: btnAnim }] }}>
            <Pressable
              onPress={handleTakePhoto}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: "#FF8A65", opacity: pressed || busy ? 0.82 : 1 },
              ]}
              testID="take-photo-button"
            >
              {busy ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <View style={styles.btnIconCircle}>
                    <CameraIcon size={22} color="#FF8A65" />
                  </View>
                  <Text style={styles.primaryBtnText}>Take a photo</Text>
                </>
              )}
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={handlePickLibrary}
            disabled={busy}
            style={({ pressed }) => [
              styles.secondaryBtn,
              { opacity: pressed || busy ? 0.72 : 1 },
            ]}
            testID="upload-gallery-button"
          >
            <View style={styles.secondaryIconCircle}>
              <ImageIcon size={20} color="#FFF" />
            </View>
            <Text style={styles.secondaryBtnText}>Upload from gallery</Text>
          </Pressable>

          <Text style={styles.hint}>
            Daily photos keep your streak and progress tracking accurate.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function AdjustButton({
  children,
  disabled,
  label,
  onPress,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.adjustButton,
        { opacity: disabled ? 0.35 : pressed ? 0.78 : 1 },
      ]}
    >
      <View style={styles.adjustIcon}>{children}</View>
      <Text style={styles.adjustLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  topTitle: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  heroArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  bedIllustration: {
    marginBottom: 32,
  },
  bedFrame: {
    width: 200,
    height: 130,
    backgroundColor: "#1B2340",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
    alignItems: "center",
    gap: 10,
    shadowColor: "#FF8A65",
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
  },
  bedPillow: {
    width: 60,
    height: 30,
    backgroundColor: "#2E3A5A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "absolute",
    top: 16,
    left: 20,
  },
  bedSheet: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    height: 56,
    backgroundColor: "#253258",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroTitle: {
    color: "#F4EFE3",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
    marginBottom: 10,
  },
  heroBody: {
    color: "#A4A7C5",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  notice: {
    color: "#FFD7C2",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 18,
    paddingHorizontal: 16,
  },

  actionsArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    borderRadius: 999,
  },
  btnIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  secondaryIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 4,
  },

  previewContent: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  previewCopy: {
    marginBottom: 14,
  },
  previewTitle: {
    color: "#F4EFE3",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  previewBody: {
    color: "rgba(244,239,227,0.66)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: "center",
  },
  previewFrame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  previewImage: {
    position: "absolute",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.72)",
  },
  gridVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "33.33%",
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  gridHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "33.33%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.42)",
  },
  previewBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  previewBusyText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "700",
  },
  adjustPanel: {
    marginTop: 14,
    padding: 12,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  adjustHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginBottom: 10,
  },
  adjustTitle: {
    color: "#FFD7C2",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  adjustRow: {
    flexDirection: "row",
    gap: 8,
  },
  adjustButton: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  adjustIcon: {
    width: 42,
    height: 38,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  adjustLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  previewError: {
    color: "#FFD7C2",
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 10,
  },
  confirmRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
  },
  confirmBtnGhost: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  confirmBtnText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  confirmBtnTextGhost: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
