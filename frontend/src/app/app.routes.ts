import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'formations',
    loadComponent: () => import('./features/catalog/catalog-list/catalog-list').then((m) => m.CatalogList),
  },
  {
    path: 'formations/:id',
    loadComponent: () => import('./features/catalog/permit-detail/permit-detail').then((m) => m.PermitDetail),
  },
  {
    path: 'reserver',
    canActivate: [authGuard],
    loadComponent: () => import('./features/booking/booking-page').then((m) => m.BookingPage),
  },
  {
    path: 'mon-espace',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'instructeur',
    canActivate: [roleGuard(['Instructor', 'Admin'])],
    loadComponent: () =>
      import('./features/instructor/instructor-portal').then((m) => m.InstructorPortal),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('Admin')],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', redirectTo: 'permis', pathMatch: 'full' },
      {
        path: 'permis',
        loadComponent: () => import('./features/admin/permits-admin/permits-admin').then((m) => m.PermitsAdmin),
      },
      {
        path: 'seances',
        loadComponent: () => import('./features/admin/sessions-admin/sessions-admin').then((m) => m.SessionsAdmin),
      },
      {
        path: 'dates-examen',
        loadComponent: () =>
          import('./features/admin/exam-dates-admin/exam-dates-admin').then((m) => m.ExamDatesAdmin),
      },
      {
        path: 'moniteurs',
        loadComponent: () =>
          import('./features/admin/instructors-admin/instructors-admin').then((m) => m.InstructorsAdmin),
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/admin/bookings-admin/bookings-admin').then((m) => m.BookingsAdmin),
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/admin/messages-admin/messages-admin').then((m) => m.MessagesAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
