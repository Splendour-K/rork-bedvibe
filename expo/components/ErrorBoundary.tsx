import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

interface State {
  hasError: boolean;
  message?: string;
}

interface Props {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.log("[ErrorBoundary]", error, info?.componentStack);
  }

  reset = (): void => {
    this.setState({ hasError: false, message: undefined });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container} testID="error-boundary">
        <View style={styles.icon}>
          <AlertTriangle size={32} color="#1B1B1F" />
        </View>
        <Text style={styles.title}>Something got tangled</Text>
        <Text style={styles.subtitle}>
          A wrinkle showed up while loading this screen. Smooth it out and try again.
        </Text>
        {this.state.message ? (
          <Text style={styles.message} numberOfLines={3}>{this.state.message}</Text>
        ) : null}
        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [styles.button, { opacity: pressed ? 0.85 : 1 }]}
          testID="error-reset"
        >
          <RefreshCw size={18} color="#FFF" />
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#F5F1EB",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFD6C4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1B1B1F",
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B6470",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 320,
  },
  message: {
    fontSize: 12,
    color: "#9A93A0",
    fontFamily: "Courier",
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1F1B2E",
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
