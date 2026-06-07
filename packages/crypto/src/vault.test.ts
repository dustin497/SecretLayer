import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { decryptVaultItem, encryptVaultItem, isEncryptedBlob } from "./vault.js";

describe("vault crypto", () => {
  it("round-trips encrypt/decrypt", async () => {
    const item = {
      id: "test-1",
      secretName: "API_KEY",
      providerName: "Stripe",
      secret: "sk_test_roundtrip",
      updatedAt: new Date().toISOString(),
    };
    const blob = await encryptVaultItem("master-pass-123", "builder@secretlayer.test", item);
    assert.equal(isEncryptedBlob(blob), true);
    const back = await decryptVaultItem("master-pass-123", blob);
    assert.equal(back.secretName, "API_KEY");
    assert.equal(back.secret, "sk_test_roundtrip");
  });

  it("rejects wrong password", async () => {
    const item = {
      id: "test-2",
      secretName: "TOKEN",
      secret: "abc",
      updatedAt: new Date().toISOString(),
    };
    const blob = await encryptVaultItem("right", "u@test.com", item);
    await assert.rejects(() => decryptVaultItem("wrong", blob));
  });
});
