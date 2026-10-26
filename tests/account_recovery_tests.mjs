import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

console.log("\n=======================================================");
console.log("RUNNING EMAIL VERIFICATION CODE PASSWORD RESET TESTS");
console.log("=======================================================\n");

const dbCode = fs.readFileSync(path.resolve("src/db/database.ts"), "utf8");
const authCode = fs.readFileSync(path.resolve("src/services/authService.ts"), "utf8");
const modalCode = fs.readFileSync(path.resolve("src/screens/Profile/LoginModal.js"), "utf8");
const emailCode = fs.readFileSync(path.resolve("src/services/emailService.ts"), "utf8");

test("1. database.ts exports createPasswordResetCode and resetPasswordWithCode", () => {
  assert.ok(
    dbCode.includes("export async function createPasswordResetCode("),
    "database.ts should export createPasswordResetCode"
  );
  assert.ok(
    dbCode.includes("export async function resetPasswordWithCode("),
    "database.ts should export resetPasswordWithCode"
  );
  assert.ok(
    dbCode.includes("SELECT code, expires_at FROM password_resets WHERE email = ? COLLATE NOCASE"),
    "database.ts should verify code and expiration"
  );
});

test("2. authService.ts exports sendPasswordResetCode and confirmPasswordReset with email dispatch", () => {
  assert.ok(
    authCode.includes("export async function sendPasswordResetCode("),
    "authService.ts should export sendPasswordResetCode"
  );
  assert.ok(
    authCode.includes("export async function confirmPasswordReset("),
    "authService.ts should export confirmPasswordReset"
  );
  assert.ok(
    authCode.includes("dispatchResetCodeEmail"),
    "authService.ts should invoke email dispatcher"
  );
});

test("3. LoginModal.js implements 6-digit email verification code UI flow", () => {
  assert.ok(
    modalCode.includes("Send verification code"),
    "LoginModal should have Send verification code action"
  );
  assert.ok(
    modalCode.includes("6-Digit Verification Code"),
    "LoginModal should have 6-Digit Verification Code input"
  );
  assert.ok(
    modalCode.includes("Update password"),
    "LoginModal should have Update password action"
  );
  assert.ok(
    modalCode.includes("Resend code"),
    "LoginModal should have Resend code action"
  );
  assert.ok(
    modalCode.includes("sendPasswordResetCode"),
    "LoginModal should call sendPasswordResetCode"
  );
  assert.ok(
    modalCode.includes("confirmPasswordReset"),
    "LoginModal should call confirmPasswordReset"
  );
});

test("4. emailService.ts provides multi-provider email dispatch", () => {
  assert.ok(
    emailCode.includes("export async function dispatchResetCodeEmail("),
    "emailService.ts should export dispatchResetCodeEmail"
  );
  assert.ok(
    emailCode.includes("brevo.com"),
    "emailService.ts should support Brevo API"
  );
  assert.ok(
    emailCode.includes("resend.com"),
    "emailService.ts should support Resend API"
  );
});
