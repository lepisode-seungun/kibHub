import { Route } from '@angular/router';
import { bootcampAccessGuard } from './guards/bootcamp-access.guard';

export const appRoutes: Route[] = [
  {
    path: 'upload',
    loadComponent: () =>
      import('./pages/upload/upload.page').then((m) => m.UploadPage),
  },
  {
    path: 'upload/:type',
    loadComponent: () =>
      import('./pages/content-upload/content-upload.page').then(
        (m) => m.ContentUploadPage
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'profile-edit',
    loadComponent: () =>
      import('./pages/profile-edit/profile-edit.page').then(
        (m) => m.ProfileEditPage
      ),
  },
  {
    path: 'change-email',
    loadComponent: () =>
      import('./pages/change-email/change-email.page').then(
        (m) => m.ChangeEmailPage
      ),
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./pages/change-password/change-password.page').then(
        (m) => m.ChangePasswordPage
      ),
  },
  {
    path: 'student-portfolio/:id',
    loadComponent: () =>
      import('./pages/student-portfolio-detail/student-portfolio-detail.page').then(
        (m) => m.StudentPortfolioDetailPage
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.page').then(
        (m) => m.ProfilePage
      ),
  },
  {
    path: 'my-bootcamp',
    loadComponent: () =>
      import('./pages/my-bootcamp/my-bootcamp.page').then(
        (m) => m.MyBootcampPage
      ),
  },
  {
    path: 'my-bootcamp/:id',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/my-bootcamp-detail/my-bootcamp-detail.page').then(
        (m) => m.MyBootcampDetailPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/lecture/:lectureId',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/lecture-detail/lecture-detail.page').then(
        (m) => m.LectureDetailPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/assignment/:assignmentId',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/assignment-detail/assignment-detail.page').then(
        (m) => m.AssignmentDetailPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/assignment/:assignmentId/submit',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/assignment-submit/assignment-submit.page').then(
        (m) => m.AssignmentSubmitPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/submission/:submissionId',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/submission-detail/submission-detail.page').then(
        (m) => m.SubmissionDetailPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/submission/:submissionId/feedback-register',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/feedback-register/feedback-register.page').then(
        (m) => m.FeedbackRegisterPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/feedback/:feedbackId',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/feedback-detail/feedback-detail.page').then(
        (m) => m.FeedbackDetailPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/feedback/:feedbackId/register',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/feedback-register/feedback-register.page').then(
        (m) => m.FeedbackRegisterPage
      ),
  },
  {
    path: 'my-bootcamp/:bootcampId/notice/:noticeId',
    canActivate: [bootcampAccessGuard],
    loadComponent: () =>
      import('./pages/notice-detail/notice-detail.page').then(
        (m) => m.NoticeDetailPage
      ),
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search/search.page').then((m) => m.SearchPage),
  },
  {
    path: 'content/:id',
    loadComponent: () =>
      import('./pages/content-detail/content-detail.page').then(
        (m) => m.ContentDetailPage
      ),
  },
  {
    path: 'hall-of-fame',
    loadComponent: () =>
      import('./pages/hall-of-fame/hall-of-fame.page').then(
        (m) => m.HallOfFamePage
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/signup/signup.page').then((m) => m.SignupPage),
  },
  {
    path: 'find-email',
    loadComponent: () =>
      import('./pages/find-email/find-email.page').then(
        (m) => m.FindEmailPage
      ),
  },
  {
    path: 'find-password',
    loadComponent: () =>
      import('./pages/find-password/find-password.page').then(
        (m) => m.FindPasswordPage
      ),
  },
  {
    path: 'bootcamp-intro',
    loadComponent: () =>
      import('./pages/bootcamp-intro/bootcamp-intro.page').then(
        (m) => m.BootcampIntroPage
      ),
  },
  {
    path: 'k-digital',
    loadComponent: () =>
      import('./pages/k-digital/k-digital.page').then(
        (m) => m.KDigitalPage
      ),
  },
  {
    path: 'k-digital/:id',
    loadComponent: () =>
      import('./pages/bootcamp-detail/bootcamp-detail.page').then(
        (m) => m.BootcampDetailPage
      ),
  },
  {
    path: 'student-portfolio',
    loadComponent: () =>
      import('./pages/student-portfolio/student-portfolio.page').then(
        (m) => m.StudentPortfolioPage
      ),
  },
  {
    path: 'student-portfolio/:id',
    loadComponent: () =>
      import(
        './pages/student-portfolio-detail/student-portfolio-detail.page'
      ).then((m) => m.StudentPortfolioDetailPage),
  },
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about/about.page').then((m) => m.AboutPage),
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./pages/terms/terms.page').then((m) => m.TermsPage),
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./pages/privacy/privacy.page').then((m) => m.PrivacyPage),
  },
  {
    path: 'customer-center',
    loadComponent: () =>
      import('./pages/customer-center/customer-center.page').then(
        (m) => m.CustomerCenterPage
      ),
  },
  {
    path: 'notice/:id',
    loadComponent: () =>
      import('./pages/cc-notice-detail/cc-notice-detail.page').then(
        (m) => m.CcNoticeDetailPage
      ),
  },
  {
    path: 'inquiry/new',
    loadComponent: () =>
      import('./pages/inquiry-form/inquiry-form.page').then(
        (m) => m.InquiryFormPage
      ),
  },
  {
    path: 'inquiry/:id',
    loadComponent: () =>
      import('./pages/inquiry-detail/inquiry-detail.page').then(
        (m) => m.InquiryDetailPage
      ),
  },
  {
    path: 'inquiry/:id/edit',
    loadComponent: () =>
      import('./pages/inquiry-form/inquiry-form.page').then(
        (m) => m.InquiryFormPage
      ),
  },
  {
    path: 'withdraw',
    loadComponent: () =>
      import('./pages/withdraw/withdraw.page').then(
        (m) => m.WithdrawPage
      ),
  },
];
