const generateOtp = (length = 6) => {
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += Math.floor(Math.random() * 10); // 0–9
  }

  return otp;
};

const generateOtpHtml = (otp, username = "User") => {
  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 500px; margin: auto; background: #fff; padding: 20px; border-radius: 10px;">
        
        <h2 style="color: #333;">Hello ${username},</h2>
        
        <p>Your One-Time Password (OTP) is:</p>
        
        <h1 style="letter-spacing: 5px; color: #4CAF50; text-align: center;">
          ${otp}
        </h1>
        
        <p>This OTP is valid for 5 minutes. Do not share it with anyone.</p>
        
        <hr />
        
        <p style="font-size: 12px; color: gray;">
          If you didn’t request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
};

export { generateOtp, generateOtpHtml };
