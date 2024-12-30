import jwt from "jsonwebtoken";

const { sign, verify } = jwt;

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

export function generateAccessToken(value: string) {
  return sign({ value }, getAccessSecret(), { expiresIn: getAccessExp() });
}
export function verifyAccessToken(token: string) {
  try {
    return verify(token, getAccessSecret());
  } catch (e) {
    return null;
  }
}

export function generateRefreshToken(value: string) {
  return sign({ value }, getRefreshSecret(), { expiresIn: getRefreshExp() });
}
export function verifyRefreshToken(token: string) {
  try {
    return verify(token, getRefreshSecret());
  } catch (e) {
    return null;
  }
}
