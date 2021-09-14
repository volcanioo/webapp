import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Report from '../views/report';
import Login from '../views/Login.vue';
import AnonymousLogin from '../views/AnonymousLogin.vue';
import CaseDetail from '../views/auth/CaseDetail.vue';
import Register from '../views/Register.vue';
import Dashboard from '../views/auth/Dashboard.vue';
import Verify from '../views/auth/Verify.vue';
import CompanySettings from '../views/auth/CompanySettings.vue';
import { auth, algoliaIndex } from '../firebase/index';
import store from "../store/index";
Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/report',
    name: 'Report',
    component: Report,
    meta: {
      anonymous: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      company: true
    }
  },
  {
    path: '/case-detail/:id?',
    name: 'CaseDetail',
    props: true,
    component: CaseDetail,
    meta: {
      case: true
    }
  },
  {
    path: '/anonymous-login',
    name: 'AnonymousLogin',
    component: AnonymousLogin,
    meta: {
      anonymous: true
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      company: true
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: {
      auth: true
    }
  },
  {
    path: '/email-verification',
    name: 'Verify',
    component: Verify,
    meta: {
      auth: true
    },
  },
  {
    path: '/company-settings',
    name: 'CompanySettings',
    component: CompanySettings,
    meta: {
      auth: true
    },
  },
  { path: "*", component: Home }
];

const router = new VueRouter({
  routes,
  mode: 'history'
});

router.beforeEach((to, from, next) => {
  // TODO !! We need to update this function to optimize firebase connections.
  auth.onAuthStateChanged(user => {
    // get the data from angolia
    if (! user) {
      next({
        path: "/login",
      })
      return;
    }

    algoliaIndex.findObject((hit) => hit.userUid === user.uid).then(({object}) => {
      if (user) {
        store.dispatch('setCompanyData', {
          company_email: user.email,
          is_mail_verified: user.emailVerified,
          userUid: user.uid,
          company_name: object.name,
          phone_number: object.phoneNumber,
          photo_url: object.photoURL,
        });
      }
    })
  })

  if (to.matched.some(record => record.meta.auth)) {
    auth.onAuthStateChanged(user => {
      if (user) {
        next()
      } else {
        next({
          path: "/login",
        })
      }
    })
  } else if (to.matched.some(record => record.meta.case)) {
    auth.onAuthStateChanged(user => {
      if ((user) || localStorage.getItem('caseId')) {
        next();
      } else {
        next({
          path: "/anonymous-login",
        })
      }
    })
  } else if (to.matched.some(record => record.meta.anonymous)) {
    if (localStorage.getItem('caseId') || store.getters.getCompany.length > 0) {
      next({
        path: "/case-detail",
      })
    } else {
      next()
    }
  } else if (to.matched.some(record => record.meta.company)) {
    auth.onAuthStateChanged(user => {
      if (user) {
        next({
          path: "/dashboard",
        })
      } else {
        next()
      }
    })

  } else {
    next()
  }

})

export default router;
