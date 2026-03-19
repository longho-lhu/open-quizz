import nodemailer from "nodemailer";

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyLink = `${appUrl}/verify?token=${token}`;

  const mailOptions = {
    from: `"Quizz Platform" <${process.env.EMAIL_USER || 'no-reply@quizz.com'}>`,
    to,
    subject: "Xác thực tài khoản Quizz",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6B21A8;">Chào ${name},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản trên nền tảng Quizz.</p>
        <p>Vui lòng click vào nút bên dưới để xác thực địa chỉ email và hoàn tất quá trình đăng ký:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyLink}" style="background-color: #6B21A8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Xác thực tài khoản</a>
        </div>
        <p style="color: #666; font-size: 14px;">Hoặc copy và dán đường link sau vào trình duyệt: <br/><a href="${verifyLink}" style="color: #3B82F6; word-break: break-all;">${verifyLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to:", to);
  } catch (error) {
    console.error("Lỗi gửi email xác thực:", error);
  }
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"Quizz Platform" <${process.env.EMAIL_USER || 'no-reply@quizz.com'}>`,
    to,
    subject: "Yêu cầu khôi phục mật khẩu Quizz",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6B21A8;">Chào ${name},</h2>
        <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu cho tài khoản Quizz của bạn.</p>
        <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu. Đường link này sẽ <b>hết hạn sau 15 phút</b>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #6B21A8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Đổi mật khẩu</a>
        </div>
        <p style="color: #666; font-size: 14px;">Hoặc copy và dán đường link sau vào trình duyệt: <br/><a href="${resetLink}" style="color: #3B82F6; word-break: break-all;">${resetLink}</a></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn vẫn an toàn.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent to:", to);
  } catch (error) {
    console.error("Lỗi gửi email khôi phục mật khẩu:", error);
  }
}
