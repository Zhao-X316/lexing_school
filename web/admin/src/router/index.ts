import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { UserRole } from '@/types/user'

/**
 * 路由配置
 */
const routes: RouteRecordRaw[] = [
  // 登录页
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  
  // 后台管理布局
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      // 仪表盘
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/DashboardPage.vue'),
        meta: { title: '仪表盘' }
      },
      
      // 账号管理
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/UsersPage.vue'),
        meta: { 
          title: '账号管理',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        }
      },
      
      // 内容管理
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/articles/ArticlesPage.vue'),
        meta: { 
          title: '文章管理',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER]
        }
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('@/views/articles/ArticleEditPage.vue'),
        meta: { 
          title: '创建文章',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER]
        }
      },
      {
        path: 'articles/:id/edit',
        name: 'ArticleEdit',
        component: () => import('@/views/articles/ArticleEditPage.vue'),
        meta: { 
          title: '编辑文章',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER]
        }
      },
      
      // 首页配置
      {
        path: 'homepage',
        name: 'Homepage',
        component: () => import('@/views/homepage/HomepagePage.vue'),
        meta: { 
          title: '首页配置',
          roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
        }
      },
      // 家长端：我的孩子看板（§11 T2、T9）
      {
        path: 'my-children',
        name: 'MyChildren',
        component: () => import('@/views/parent/MyChildrenPage.vue'),
        meta: { 
          title: '我的孩子',
          roles: [UserRole.PARENT]
        }
      },
      // 四级标签库管理（§11 T3）
      {
        path: 'teaching-targets',
        name: 'TeachingTargets',
        component: () => import('@/views/teaching-targets/TeachingTargetsPage.vue'),
        meta: { title: '教案库管理', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      },
      // 动态模板管理（§11 T4）
      {
        path: 'templates',
        name: 'Templates',
        component: () => import('@/views/templates/TemplatesPage.vue'),
        meta: { title: '模板管理', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] }
      },
      // 学生管理（§11 T5）
      {
        path: 'students',
        name: 'Students',
        component: () => import('@/views/students/StudentsPage.vue'),
        meta: { title: '学生管理', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER] }
      },
      // 教师端：评估工作台（§11 T6，依据 docs/评估与教案页面改造计划.md）
      {
        path: 'assessments',
        name: 'Assessments',
        component: () => import('@/views/assessments/AssessmentsPage.vue'),
        meta: { title: '评估与教案', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER] }
      },
      {
        path: 'assessments/generate',
        name: 'AssessmentGenerate',
        component: () => import('@/views/assessments/AssessmentGeneratePage.vue'),
        meta: { title: '生成教案', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER] }
      },
      // 学生个人页：雷达图、折线图（§11 T8）
      {
        path: 'students/:id/profile',
        name: 'StudentProfile',
        component: () => import('@/views/students/StudentProfilePage.vue'),
        meta: { title: '学生档案与图表', roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT] }
      }
    ]
  },
  
  // 403 无权限页（§11 T1）
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/ForbiddenPage.vue'),
    meta: { title: '无权限访问', requiresAuth: true }
  },
  
  // 404 页面（未登录也应能访问，避免未知路径被重定向到登录页）
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundPage.vue'),
    meta: { title: '页面不存在', requiresAuth: false }
  }
]

/**
 * 创建路由实例
 */
const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * 路由守卫
 */
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 乐星融合学校管理系统` : '乐星融合学校管理系统'
  
  const userStore = useUserStore()
  
  // 恢复登录状态
  if (!userStore.user) {
    userStore.restoreFromStorage()
  }
  
  // 需要认证的页面
  if (to.meta.requiresAuth !== false) {
    if (!userStore.isLoggedIn) {
      return next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
    
    // 检查角色权限（§4.4.1：越权跳转 403 无权限页）
    const requiredRoles = to.meta.roles as UserRole[] | undefined
    if (requiredRoles && userStore.userRole) {
      if (!requiredRoles.includes(userStore.userRole)) {
        return next('/403')
      }
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && userStore.isLoggedIn) {
    return next(userStore.isParent ? '/my-children' : '/')
  }
  // 家长角色默认进入「我的孩子」看板（§4.3、§11 T2）
  if ((to.path === '/' || to.path === '/dashboard') && userStore.isParent) {
    return next('/my-children')
  }
  
  next()
})

export default router
