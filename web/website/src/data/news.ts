export interface NewsItem {
  id: number
  image: string
  date: string
  title: string
  excerpt: string
}

export const newsData: NewsItem[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1000&auto=format&fit=crop',
    date: '2024.10',
    title: '秋学期开课通知',
    excerpt:
      '2024秋季学期将于9月正式开启，新学期增设了更多融合课程，欢迎新老学员报名参加。'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000&auto=format&fit=crop',
    date: '2024.10',
    title: '家长课堂第42期',
    excerpt: '本期家长课堂主题为「如何在家庭中支持孩子融合」，特邀资深儿童心理学家分享经验。'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1000&auto=format&fit=crop',
    date: '2024.09',
    title: '户外实践活动',
    excerpt: '全校师生前往植物园开展户外实践，通过自然观察和互动游戏，提升孩子们的社交能力。'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=1000&auto=format&fit=crop',
    date: '2024.09',
    title: '融合教育研讨会',
    excerpt: '学校承办市级融合教育研讨会，分享我校在融合教育领域的实践成果与心得体会。'
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop',
    date: '2024.08',
    title: '暑假成果展',
    excerpt: '暑期课程圆满结束，孩子们展示了自己在艺术、运动、手工等方面的丰硕成果。'
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1000&auto=format&fit=crop',
    date: '2024.08',
    title: '教师培训圆满完成',
    excerpt: '全体教师参加暑期专项培训，学习最新的融合教育理念与实践方法，为新学期做好准备。'
  }
]
