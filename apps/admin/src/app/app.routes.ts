import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: 'members',
        loadComponent: () =>
          import('./pages/members/members.page').then(
            (m) => m.MembersPage
          ),
      },
      {
        path: 'members/:id',
        loadComponent: () =>
          import('./pages/member-detail/member-detail.page').then(
            (m) => m.MemberDetailPage
          ),
      },
      {
        path: 'admins',
        loadComponent: () =>
          import('./pages/admins/admins.page').then(
            (m) => m.AdminsPage
          ),
      },
      {
        path: 'content',
        loadComponent: () =>
          import('./pages/content/content.page').then(
            (m) => m.ContentPage
          ),
      },
      {
        path: 'content/reports',
        loadComponent: () =>
          import('./pages/reports/reports.page').then(
            (m) => m.ReportsPage
          ),
      },
      {
        path: 'content/:id',
        loadComponent: () =>
          import('./pages/content-detail/content-detail.page').then(
            (m) => m.ContentDetailPage
          ),
      },
      {
        path: 'site/bootcamp-intro',
        loadComponent: () =>
          import('./pages/bootcamp-intro/bootcamp-intro.page').then(
            (m) => m.BootcampIntroPage
          ),
      },
      {
        path: 'site/portfolio',
        loadComponent: () =>
          import('./pages/portfolio/portfolio.page').then(
            (m) => m.PortfolioPage
          ),
      },
      {
        path: 'site/business-info',
        loadComponent: () =>
          import('./pages/business-info/business-info.page').then(
            (m) => m.BusinessInfoPage
          ),
      },
      {
        path: 'site/terms',
        loadComponent: () =>
          import('./pages/schedule/schedule.page').then(
            (m) => m.SchedulePage
          ),
      },
      {
        path: 'bootcamp',
        loadComponent: () =>
          import('./pages/bootcamp/bootcamp.page').then(
            (m) => m.BootcampPage
          ),
      },
      {
        path: 'bootcamp/home/dashboard',
        loadComponent: () =>
          import('./pages/bootcamp-dashboard/bootcamp-dashboard.page').then(
            (m) => m.BootcampDashboardPage
          ),
      },
      {
        path: 'bootcamp/home/applicants',
        loadComponent: () =>
          import('./pages/bootcamp-applicants/bootcamp-applicants.page').then(
            (m) => m.BootcampApplicantsPage
          ),
      },
      {
        path: 'bootcamp/home/applicants/:id',
        loadComponent: () =>
          import('./pages/applicant-detail/applicant-detail.page').then(
            (m) => m.ApplicantDetailPage
          ),
      },
      {
        path: 'bootcamp/home/recruitment',
        loadComponent: () =>
          import('./pages/recruitment/recruitment.page').then(
            (m) => m.RecruitmentPage
          ),
      },
      {
        path: 'bootcamp/home/curriculum',
        loadComponent: () =>
          import('./pages/course/course.page').then(
            (m) => m.CoursePage
          ),
      },
      {
        path: 'bootcamp/home/curriculum/:id',
        loadComponent: () =>
          import('./pages/course-detail/course-detail.page').then(
            (m) => m.CourseDetailPage
          ),
      },
      {
        path: 'bootcamp/home/curriculum/:id/lecture/new',
        loadComponent: () =>
          import('./pages/lecture-register/lecture-register.page').then(
            (m) => m.LectureRegisterPage
          ),
      },
      {
        path: 'bootcamp/home/curriculum/:id/lecture/:lectureId',
        loadComponent: () =>
          import('./pages/lecture-detail/lecture-detail.page').then(
            (m) => m.LectureDetailPage
          ),
      },
      {
        path: 'bootcamp/home/curriculum/:id/assignment/new',
        loadComponent: () =>
          import('./pages/assignment-register/assignment-register.page').then(
            (m) => m.AssignmentRegisterPage
          ),
      },
      {
        path: 'bootcamp/home/curriculum/:id/assignment/:assignmentId',
        loadComponent: () =>
          import('./pages/assignment-detail/assignment-detail.page').then(
            (m) => m.AssignmentDetailPage
          ),
      },
      {
        path: 'bootcamp/home/notices',
        loadComponent: () =>
          import('./pages/notice/notice.page').then(
            (m) => m.NoticePage
          ),
      },
      {
        path: 'bootcamp/home/notices/new',
        loadComponent: () =>
          import('./pages/notice-register/notice-register.page').then(
            (m) => m.NoticeRegisterPage
          ),
      },
      {
        path: 'bootcamp/home/notices/:id/edit',
        loadComponent: () =>
          import('./pages/notice-register/notice-register.page').then(
            (m) => m.NoticeRegisterPage
          ),
      },
      {
        path: 'support/notices',
        loadComponent: () =>
          import('./pages/support-notices/support-notices.page').then(
            (m) => m.SupportNoticesPage
          ),
      },
      {
        path: 'support/notices/new',
        loadComponent: () =>
          import('./pages/support-notices-register/support-notices-register.page').then(
            (m) => m.SupportNoticesRegisterPage
          ),
      },
      {
        path: 'support/notices/:id/edit',
        loadComponent: () =>
          import('./pages/support-notices-register/support-notices-register.page').then(
            (m) => m.SupportNoticesRegisterPage
          ),
      },
      {
        path: 'support/faq',
        loadComponent: () =>
          import('./pages/support-faq/support-faq.page').then(
            (m) => m.SupportFaqPage
          ),
      },
      {
        path: 'support/inquiries',
        loadComponent: () =>
          import('./pages/support-inquiries/support-inquiries.page').then(
            (m) => m.SupportInquiriesPage
          ),
      },
      {
        path: 'dashboard',
        redirectTo: 'members',
        pathMatch: 'full',
      },
      {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full',
      },
    ],
  },
];
