// AES-256 암호화 서비스
// 건강 데이터 암/복호화

const ALGORITHM = "aes-256-gcm";

function encrypt(plaintext) {
  // TODO: AES-256-GCM 암호화
  // return { ciphertext, iv, authTag }
}

function decrypt(ciphertext, iv, authTag) {
  // TODO: AES-256-GCM 복호화
  // return plaintext
}

module.exports = { encrypt, decrypt };
