import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logoCid = 'kiphub-logo';
  private readonly logoPath = path.join(__dirname, 'assets', 'kiphub-logo.png');

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: Number(process.env['SMTP_PORT']) || 587,
      secure: false,
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  /** 로고를 CID 인라인 첨부파일로 포함하는 공통 설정 */
  private getLogoAttachment(): nodemailer.SendMailOptions['attachments'] {
    return [
      {
        filename: 'kiphub-logo.png',
        path: this.logoPath,
        cid: this.logoCid,
      },
    ];
  }

  /** 공통 이메일 래퍼 - 헤더(로고) + 본문 + 푸터 */
  private wrapEmailTemplate(bodyContent: string): string {
    const logoSrc = `cid:${this.logoCid}`;

    return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#E4E4E7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E4E4E7;padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="800" cellpadding="0" cellspacing="0" style="max-width:800px;width:100%;border-radius:24px;overflow:hidden;">
  <tr>
    <td style="background:#FFFFFF;padding:24px 24px 24px 16px;height:80px;box-sizing:border-box;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:8px;">
          <img src="${logoSrc}" alt="KIPhub" width="48" style="display:block;height:auto;" />
        </td>
        <td style="font-family:'Prompt',sans-serif;font-weight:600;font-size:21.12px;line-height:32px;letter-spacing:-0.04em;color:#272727;vertical-align:middle;">KIPhub</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#FAFAFA;padding:100px 24px;text-align:center;">
      ${bodyContent}
    </td>
  </tr>
  <tr>
    <td style="background:#FFFFFF;padding:32px 32px 32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
          <td style="vertical-align:middle;padding-right:8px;">
            <img src="${logoSrc}" alt="KIPhub" width="36" style="display:block;height:auto;" />
          </td>
          <td style="font-family:'Prompt',sans-serif;font-weight:600;font-size:21.12px;line-height:32px;letter-spacing:-0.04em;color:#272727;vertical-align:middle;">KIPhub</td>
        </tr></table>
        <div style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:600;font-size:12px;line-height:15px;letter-spacing:-0.04em;color:#71717A;">
          <span>상호명</span>&nbsp;&nbsp;<span>GrobalSM</span>&nbsp;&nbsp;<span>주소 : (00000) 광주광역시 동구 문화전당로26번길 지하7, 104-A</span>
        </div>
        <div style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:600;font-size:12px;line-height:15px;letter-spacing:-0.04em;color:#71717A;margin-top:8px;">사업자 등록번호 : XXX-XX-XXXXX</div>
      </td></tr></table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  async sendVerificationCode(to: string, code: string): Promise<void> {
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#3C8EEE;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="https://img.icons8.com/ios-filled/32/ffffff/secured-letter.png" alt="mail" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">인증번호 안내</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">아래 인증번호를 입력해주세요.<br>인증번호는 5분간 유효합니다.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-block;background:#FFFFFF;border-radius:12px;padding:20px 48px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#3C8EEE;font-family:'SUIT',monospace;">${code}</span>
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본인이 요청하지 않았다면 이 메일을 무시하세요.</td></tr>
      </table>`;

    await this.transporter.sendMail({
      from: process.env['SMTP_FROM'] || process.env['SMTP_USER'],
      to,
      subject: '[KibHub] 인증번호 안내',
      html: this.wrapEmailTemplate(bodyContent),
      attachments: this.getLogoAttachment(),
    });
  }

  async sendTempPassword(to: string, tempPassword: string): Promise<void> {
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#F59E0B;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="https://img.icons8.com/ios-filled/32/ffffff/key.png" alt="key" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">임시 비밀번호 안내</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">아래 임시 비밀번호로 로그인한 후<br>비밀번호를 변경해주세요.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-block;background:#FFFFFF;border-radius:12px;padding:20px 48px;">
            <span style="font-size:24px;font-weight:700;color:#F59E0B;font-family:'SUIT',monospace;">${tempPassword}</span>
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본인이 요청하지 않았다면 관리자에게 문의하세요.</td></tr>
      </table>`;

    await this.transporter.sendMail({
      from: process.env['SMTP_FROM'] || process.env['SMTP_USER'],
      to,
      subject: '[KibHub] 임시 비밀번호 안내',
      html: this.wrapEmailTemplate(bodyContent),
      attachments: this.getLogoAttachment(),
    });
  }

  async sendPasswordResetLink(to: string, resetLink: string): Promise<void> {
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#7A48FF;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBvcGFjaXR5PSIwLjUiIGQ9Ik00LjIzMDY0IDI1LjEwNjZDNS43OTE5NyAyNi42NjkzIDguMzA2NjQgMjYuNjY5MyAxMy4zMzQ2IDI2LjY2OTNMMjEuMDAxMyAyNi42NjEzQzI0LjUxNiAyNi42MjUzIDI2LjQ3MzMgMjYuNDA2NiAyNy43NzIgMjUuMTA2NkMyOS4zMzQ2IDIzLjU0NjYgMjkuMzM0NiAyMS4wMzA2IDI5LjMzNDYgMTYuMDAyNkMyOS4zMzQ2IDEwLjk3NDYgMjkuMzM0NiA4LjQ1OTk0IDI3Ljc3MiA2Ljg5ODZDMjYuNDczMyA1LjU5ODYgMjQuNSA1LjM3MzI3IDIwLjk4NTMgNS4zMzU5NEgxMy4zMzQ2QzguMzA2NjQgNS4zMzU5NCA1Ljc5MTk3IDUuMzM1OTQgNC4yMzA2NCA2Ljg5ODZDMi42NjkzIDguNDYxMjcgMi42Njc5NyAxMC45NzQ2IDIuNjY3OTcgMTYuMDAyNkMyLjY2Nzk3IDIxLjAzMDYgMi42Njc5NyAyMy41NDUzIDQuMjMwNjQgMjUuMTA2NloiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTE3LjMzMiAxNS45OTc0QzE3LjMzMiAxNS42NDM4IDE3LjE5MTYgMTUuMzA0NiAxNi45NDE1IDE1LjA1NDZDMTYuNjkxNSAxNC44MDQ1IDE2LjM1MjMgMTQuNjY0MSAxNS45OTg3IDE0LjY2NDFDMTUuNjQ1MSAxNC42NjQxIDE1LjMwNTkgMTQuODA0NSAxNS4wNTU5IDE1LjA1NDZDMTQuODA1OCAxNS4zMDQ2IDE0LjY2NTQgMTUuNjQzOCAxNC42NjU0IDE1Ljk5NzRDMTQuNjY1NCAxNi4zNTEgMTQuODA1OCAxNi42OTAyIDE1LjA1NTkgMTYuOTQwMkMxNS4zMDU5IDE3LjE5MDMgMTUuNjQ1MSAxNy4zMzA3IDE1Ljk5ODcgMTcuMzMwN0MxNi4zNTIzIDE3LjMzMDcgMTYuNjkxNSAxNy4xOTAzIDE2Ljk0MTUgMTYuOTQwMkMxNy4xOTE2IDE2LjY5MDIgMTcuMzMyIDE2LjM1MSAxNy4zMzIgMTUuOTk3NFpNMTAuNjY1NCAxNy4zMzA3QzExLjAxOSAxNy4zMzA3IDExLjM1ODEgMTcuMTkwMyAxMS42MDgyIDE2Ljk0MDJDMTEuODU4MiAxNi42OTAyIDExLjk5ODcgMTYuMzUxIDExLjk5ODcgMTUuOTk3NEMxMS45OTg3IDE1LjY0MzggMTEuODU4MiAxNS4zMDQ2IDExLjYwODIgMTUuMDU0NkMxMS4zNTgxIDE0LjgwNDUgMTEuMDE5IDE0LjY2NDEgMTAuNjY1NCAxNC42NjQxQzEwLjMxMTcgMTQuNjY0MSA5Ljk3MjYgMTQuODA0NSA5LjcyMjU2IDE1LjA1NDZDOS40NzI1MSAxNS4zMDQ2IDkuMzMyMDMgMTUuNjQzOCA5LjMzMjAzIDE1Ljk5NzRDOS4zMzIwMyAxNi4zNTEgOS40NzI1MSAxNi42OTAyIDkuNzIyNTYgMTYuOTQwMkM5Ljk3MjYgMTcuMTkwMyAxMC4zMTE3IDE3LjMzMDcgMTAuNjY1NCAxNy4zMzA3WiIgZmlsbD0id2hpdGUiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIwIDEuNjY0MDZDMjAuMjY1MiAxLjY2NDA2IDIwLjUxOTYgMS43Njk0MiAyMC43MDcxIDEuOTU2OTZDMjAuODk0NiAyLjE0NDQ5IDIxIDIuMzk4ODUgMjEgMi42NjQwNlYyOS4zMzA3QzIxIDI5LjU5NTkgMjAuODk0NiAyOS44NTAzIDIwLjcwNzEgMzAuMDM3OEMyMC41MTk2IDMwLjIyNTQgMjAuMjY1MiAzMC4zMzA3IDIwIDMwLjMzMDdDMTkuNzM0OCAzMC4zMzA3IDE5LjQ4MDQgMzAuMjI1NCAxOS4yOTI5IDMwLjAzNzhDMTkuMTA1NCAyOS44NTAzIDE5IDI5LjU5NTkgMTkgMjkuMzMwN1YyLjY2NDA2QzE5IDIuMzk4ODUgMTkuMTA1NCAyLjE0NDQ5IDE5LjI5MjkgMS45NTY5NkMxOS40ODA0IDEuNzY5NDIgMTkuNzM0OCAxLjY2NDA2IDIwIDEuNjY0MDZaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="lock" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">비밀번호 재설정</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">비밀번호 재설정을 위한 링크를 아래에 공유드립니다.<br>해당 링크는 보안을 위해 메일 발송 후 10분간 유효하며,<br>타인과 공유하지 않도록 주의해주시기 바랍니다.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
            <td align="center" bgcolor="#7A48FF" style="background:#7A48FF;border-radius:12px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 48px;font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;letter-spacing:-0.04em;color:#FFFFFF;text-decoration:none;border-radius:12px;">비밀번호 재설정하기</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본 메일은 발신전용으로 고객님께 알려드리는 안내메일입니다.<br>문의사항은 홈페이지 또는 고객센터를 이용하시기 바랍니다.</td></tr>
      </table>`;

    await this.transporter.sendMail({
      from: process.env['SMTP_FROM'] || process.env['SMTP_USER'],
      to,
      subject: '[KibHub] 비밀번호 재설정 안내',
      html: this.wrapEmailTemplate(bodyContent),
      attachments: this.getLogoAttachment(),
    });
  }

  // ===== 미리보기용 메서드 (브라우저에서 확인) =====

  /** 미리보기용 래퍼 - CID 대신 URL로 로고 참조 */
  private wrapEmailTemplateForPreview(bodyContent: string, logoUrl: string): string {
    return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#E4E4E7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E4E4E7;padding:40px 0;">
<tr><td align="center">
<table role="presentation" width="800" cellpadding="0" cellspacing="0" style="max-width:800px;width:100%;border-radius:24px;overflow:hidden;">
  <tr>
    <td style="background:#FFFFFF;padding:24px 24px 24px 16px;height:80px;box-sizing:border-box;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;padding-right:8px;">
          <img src="${logoUrl}" alt="KIPhub" width="48" style="display:block;height:auto;" />
        </td>
        <td style="font-family:'Prompt',sans-serif;font-weight:600;font-size:21.12px;line-height:32px;letter-spacing:-0.04em;color:#272727;vertical-align:middle;">KIPhub</td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td style="background:#FAFAFA;padding:100px 24px;text-align:center;">
      ${bodyContent}
    </td>
  </tr>
  <tr>
    <td style="background:#FFFFFF;padding:32px 32px 32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>
        <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr>
          <td style="vertical-align:middle;padding-right:8px;">
            <img src="${logoUrl}" alt="KIPhub" width="36" style="display:block;height:auto;" />
          </td>
          <td style="font-family:'Prompt',sans-serif;font-weight:600;font-size:21.12px;line-height:32px;letter-spacing:-0.04em;color:#272727;vertical-align:middle;">KIPhub</td>
        </tr></table>
        <div style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:600;font-size:12px;line-height:15px;letter-spacing:-0.04em;color:#71717A;">
          <span>상호명</span>&nbsp;&nbsp;<span>GrobalSM</span>&nbsp;&nbsp;<span>주소 : (00000) 광주광역시 동구 문화전당로26번길 지하7, 104-A</span>
        </div>
        <div style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:600;font-size:12px;line-height:15px;letter-spacing:-0.04em;color:#71717A;margin-top:8px;">사업자 등록번호 : XXX-XX-XXXXX</div>
      </td></tr></table>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  }

  /** 비밀번호 재설정 이메일 미리보기 HTML */
  getResetPasswordHtml(resetLink: string): string {
    const logoUrl = '/api/auth/logo.png';
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#7A48FF;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBvcGFjaXR5PSIwLjUiIGQ9Ik00LjIzMDY0IDI1LjEwNjZDNS43OTE5NyAyNi42NjkzIDguMzA2NjQgMjYuNjY5MyAxMy4zMzQ2IDI2LjY2OTNMMjEuMDAxMyAyNi42NjEzQzI0LjUxNiAyNi42MjUzIDI2LjQ3MzMgMjYuNDA2NiAyNy43NzIgMjUuMTA2NkMyOS4zMzQ2IDIzLjU0NjYgMjkuMzM0NiAyMS4wMzA2IDI5LjMzNDYgMTYuMDAyNkMyOS4zMzQ2IDEwLjk3NDYgMjkuMzM0NiA4LjQ1OTk0IDI3Ljc3MiA2Ljg5ODZDMjYuNDczMyA1LjU5ODYgMjQuNSA1LjM3MzI3IDIwLjk4NTMgNS4zMzU5NEgxMy4zMzQ2QzguMzA2NjQgNS4zMzU5NCA1Ljc5MTk3IDUuMzM1OTQgNC4yMzA2NCA2Ljg5ODZDMi42NjkzIDguNDYxMjcgMi42Njc5NyAxMC45NzQ2IDIuNjY3OTcgMTYuMDAyNkMyLjY2Nzk3IDIxLjAzMDYgMi42Njc5NyAyMy41NDUzIDQuMjMwNjQgMjUuMTA2NloiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTE3LjMzMiAxNS45OTc0QzE3LjMzMiAxNS42NDM4IDE3LjE5MTYgMTUuMzA0NiAxNi45NDE1IDE1LjA1NDZDMTYuNjkxNSAxNC44MDQ1IDE2LjM1MjMgMTQuNjY0MSAxNS45OTg3IDE0LjY2NDFDMTUuNjQ1MSAxNC42NjQxIDE1LjMwNTkgMTQuODA0NSAxNS4wNTU5IDE1LjA1NDZDMTQuODA1OCAxNS4zMDQ2IDE0LjY2NTQgMTUuNjQzOCAxNC42NjU0IDE1Ljk5NzRDMTQuNjY1NCAxNi4zNTEgMTQuODA1OCAxNi42OTAyIDE1LjA1NTkgMTYuOTQwMkMxNS4zMDU5IDE3LjE5MDMgMTUuNjQ1MSAxNy4zMzA3IDE1Ljk5ODcgMTcuMzMwN0MxNi4zNTIzIDE3LjMzMDcgMTYuNjkxNSAxNy4xOTAzIDE2Ljk0MTUgMTYuOTQwMkMxNy4xOTE2IDE2LjY5MDIgMTcuMzMyIDE2LjM1MSAxNy4zMzIgMTUuOTk3NFpNMTAuNjY1NCAxNy4zMzA3QzExLjAxOSAxNy4zMzA3IDExLjM1ODEgMTcuMTkwMyAxMS42MDgyIDE2Ljk0MDJDMTEuODU4MiAxNi42OTAyIDExLjk5ODcgMTYuMzUxIDExLjk5ODcgMTUuOTk3NEMxMS45OTg3IDE1LjY0MzggMTEuODU4MiAxNS4zMDQ2IDExLjYwODIgMTUuMDU0NkMxMS4zNTgxIDE0LjgwNDUgMTEuMDE5IDE0LjY2NDEgMTAuNjY1NCAxNC42NjQxQzEwLjMxMTcgMTQuNjY0MSA5Ljk3MjYgMTQuODA0NSA5LjcyMjU2IDE1LjA1NDZDOS40NzI1MSAxNS4zMDQ2IDkuMzMyMDMgMTUuNjQzOCA5LjMzMjAzIDE1Ljk5NzRDOS4zMzIwMyAxNi4zNTEgOS40NzI1MSAxNi42OTAyIDkuNzIyNTYgMTYuOTQwMkM5Ljk3MjYgMTcuMTkwMyAxMC4zMTE3IDE3LjMzMDcgMTAuNjY1NCAxNy4zMzA3WiIgZmlsbD0id2hpdGUiLz48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTIwIDEuNjY0MDZDMjAuMjY1MiAxLjY2NDA2IDIwLjUxOTYgMS43Njk0MiAyMC43MDcxIDEuOTU2OTZDMjAuODk0NiAyLjE0NDQ5IDIxIDIuMzk4ODUgMjEgMi42NjQwNlYyOS4zMzA3QzIxIDI5LjU5NTkgMjAuODk0NiAyOS44NTAzIDIwLjcwNzEgMzAuMDM3OEMyMC41MTk2IDMwLjIyNTQgMjAuMjY1MiAzMC4zMzA3IDIwIDMwLjMzMDdDMTkuNzM0OCAzMC4zMzA3IDE5LjQ4MDQgMzAuMjI1NCAxOS4yOTI5IDMwLjAzNzhDMTkuMTA1NCAyOS44NTAzIDE5IDI5LjU5NTkgMTkgMjkuMzMwN1YyLjY2NDA2QzE5IDIuMzk4ODUgMTkuMTA1NCAyLjE0NDQ5IDE5LjI5MjkgMS45NTY5NkMxOS40ODA0IDEuNzY5NDIgMTkuNzM0OCAxLjY2NDA2IDIwIDEuNjY0MDZaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="lock" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">비밀번호 재설정</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">비밀번호 재설정을 위한 링크를 아래에 공유드립니다.<br>해당 링크는 보안을 위해 메일 발송 후 10분간 유효하며,<br>타인과 공유하지 않도록 주의해주시기 바랍니다.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
            <td align="center" bgcolor="#7A48FF" style="background:#7A48FF;border-radius:12px;">
              <a href="${resetLink}" target="_blank" style="display:inline-block;padding:14px 48px;font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;letter-spacing:-0.04em;color:#FFFFFF;text-decoration:none;border-radius:12px;">비밀번호 재설정하기</a>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본 메일은 발신전용으로 고객님께 알려드리는 안내메일입니다.<br>문의사항은 홈페이지 또는 고객센터를 이용하시기 바랍니다.</td></tr>
      </table>`;
    return this.wrapEmailTemplateForPreview(bodyContent, logoUrl);
  }

  /** 인증번호 이메일 미리보기 HTML */
  getVerificationCodeHtml(code: string): string {
    const logoUrl = '/api/auth/logo.png';
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#3C8EEE;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="https://img.icons8.com/ios-filled/32/ffffff/secured-letter.png" alt="mail" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">인증번호 안내</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">아래 인증번호를 입력해주세요.<br>인증번호는 5분간 유효합니다.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-block;background:#FFFFFF;border-radius:12px;padding:20px 48px;">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#3C8EEE;font-family:'SUIT',monospace;">${code}</span>
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본인이 요청하지 않았다면 이 메일을 무시하세요.</td></tr>
      </table>`;
    return this.wrapEmailTemplateForPreview(bodyContent, logoUrl);
  }

  /** 임시 비밀번호 이메일 미리보기 HTML */
  getTempPasswordHtml(tempPassword: string): string {
    const logoUrl = '/api/auth/logo.png';
    const bodyContent = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="width:68px;height:68px;background:#F59E0B;border-radius:50%;display:inline-block;line-height:68px;text-align:center;">
            <img src="https://img.icons8.com/ios-filled/32/ffffff/key.png" alt="key" width="32" height="32" style="vertical-align:middle;" />
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:700;font-size:32px;line-height:150%;letter-spacing:-0.04em;color:#27272A;text-align:center;padding-bottom:32px;">임시 비밀번호 안내</td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:16px;line-height:150%;letter-spacing:-0.04em;color:#71717A;text-align:center;padding-bottom:32px;">아래 임시 비밀번호로 로그인한 후<br>비밀번호를 변경해주세요.</td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <div style="display:inline-block;background:#FFFFFF;border-radius:12px;padding:20px 48px;">
            <span style="font-size:24px;font-weight:700;color:#F59E0B;font-family:'SUIT',monospace;">${tempPassword}</span>
          </div>
        </td></tr>
        <tr><td style="font-family:'SUIT','Apple SD Gothic Neo',sans-serif;font-weight:500;font-size:14px;line-height:150%;letter-spacing:-0.04em;color:#A1A1AA;text-align:center;">본인이 요청하지 않았다면 관리자에게 문의하세요.</td></tr>
      </table>`;
    return this.wrapEmailTemplateForPreview(bodyContent, logoUrl);
  }
}
