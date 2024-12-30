import { sign, verify } from "jsonwebtoken";
import { process } from "node";

function getAccessSecret() {
  if (
    !process.env.JWT_SESSION_SECRET ||
    process.env.JWT_SESSION_SECRET.length === 0
  ) {
    throw new Error(
      "JWT_SESSION_SECRET belum diatur dalam file .env. Harap tambahkan JWT_SESSION_SECRET=your_secret_key pada file .env"
    );
  }

  return process.env.JWT_SESSION_SECRET;
}

function getAccessExp() {
  if (
    !process.env.JWT_SESSION_EXP ||
    process.env.JWT_SESSION_EXP.length === 0
  ) {
    throw new Error(
      "JWT_SESSION_EXP belum diatur dalam file .env. Harap tambahkan JWT_SESSION_EXP=15m pada file .env"
    );
  }

  return process.env.JWT_SESSION_EXP;
}

function getRefreshSecret() {
  if (
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_REFRESH_SECRET.length === 0
  ) {
    throw new Error(
      "JWT_REFRESH_SECRET belum diatur dalam file .env. Harap tambahkan JWT_REFRESH_SECRET=your_secret_key pada file .env"
    );
  }

  return process.env.JWT_REFRESH_SECRET;
}

function getRefreshExp() {
  if (
    !process.env.JWT_REFRESH_EXP ||
    process.env.JWT_REFRESH_EXP.length === 0
  ) {
    throw new Error(
      "JWT_REFRESH_EXP belum diatur dalam file .env. Harap tambahkan JWT_REFRESH_EXP=7d pada file .env"
    );
  }

  return process.env.JWT_REFRESH_EXP;
}

/**
 * Generates an access token with the provided value.
 * @param {string} value - The value to be encoded in the token.
 * @returns {string} The generated access token.
 */
export function generateAccessToken(value) {
  return sign({ value }, getAccessSecret(), { expiresIn: getAccessExp() });
}

/**
 * Verifies an access token.
 * @param {string} token - The access token to verify.
 * @returns {object|null} The decoded token payload if valid, null if invalid.
 */
export function verifyAccessToken(token) {
  try {
    return verify(token, getAccessSecret());
  } catch (e) {
    return null;
  }
}

/**
 * Generates a refresh token with the provided value.
 * @param {string} value - The value to be encoded in the token.
 * @returns {string} The generated refresh token.
 */
export function generateRefreshToken(value) {
  return sign({ value }, getRefreshSecret(), { expiresIn: getRefreshExp() });
}

/**
 * Verifies a refresh token.
 * @param {string} token - The refresh token to verify.
 * @returns {object|null} The decoded token payload if valid, null if invalid.
 */
export function verifyRefreshToken(token) {
  try {
    return verify(token, getRefreshSecret());
  } catch (e) {
    return null;
  }
}
