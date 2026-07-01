import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectButton } from "../connect-button";

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: "mock-connect-button",
  },
}));

describe("ConnectButton", () => {
  it("renders when MiniPay not detected", () => {
    vi.stubGlobal("window", {
      ethereum: { isMiniPay: false },
    });
    const { container } = render(<ConnectButton />);
    expect(container.innerHTML).not.toBe("");
  });

  it("renders nothing when MiniPay is detected", () => {
    vi.stubGlobal("window", {
      ethereum: { isMiniPay: true },
    });
    const { container } = render(<ConnectButton />);
    expect(container.innerHTML).toBe("");
  });

  it("renders when ethereum is undefined", () => {
    vi.stubGlobal("window", {});
    const { container } = render(<ConnectButton />);
    expect(container.innerHTML).not.toBe("");
  });
});
