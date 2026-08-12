import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'my-bootcamp/:id',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/lecture/:lectureId',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/assignment/:assignmentId',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/assignment/:assignmentId/submit',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/submission/:submissionId',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/feedback/:feedbackId',
    renderMode: RenderMode.Client
  },
  {
    path: 'my-bootcamp/:bootcampId/notice/:noticeId',
    renderMode: RenderMode.Client
  },
  {
    path: 'upload/:type',
    renderMode: RenderMode.Client
  },
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
