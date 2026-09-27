import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Search,
  BookmarkCheck,
} from 'lucide-react';

export interface BlogPost {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

export const BLOG_CATEGORIES = [
  'All Articles',
  'Coding For Kids & Teens',
  'Financial Literacy for Kids',
  'English For Kids',
  'Science For Kids',
  'Math For Kids',
  'Parenting Tips',
] as const;

export const SAMPLE_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    category: 'Coding For Kids & Teens',
    title: 'Is Your Child Ready to Transition Beyond Scratch to Text-Based Coding?',
    excerpt:
      'Block-based coding builds foundational logic, but when is the optimal moment to introduce Python or JavaScript without overwhelming your young learner?',
    author: 'Ananya Sharma',
    authorRole: 'Senior STEM Curriculum Specialist',
    date: 'Sep 24, 2026',
    readTime: '7 min read',
    image: '/images/blog/coding.jpg',
    featured: true,
  },
  {
    id: 'post-2',
    category: 'Math For Kids',
    title: 'Why Kids Get Stuck Halfway Through Word Problems — And How to Help',
    excerpt:
      'Math anxiety frequently stems from reading comprehension rather than calculation. Discover 4 guided strategies to decode multi-step word problems with ease.',
    author: 'Rajesh Kulkarni',
    authorRole: 'Lead Mathematics Educator',
    date: 'Sep 21, 2026',
    readTime: '6 min read',
    image: '/images/blog/math.jpg',
  },
  {
    id: 'post-3',
    category: 'English For Kids',
    title: 'From Feedback to Fluency: Helping Young Writers Act on Suggestions',
    excerpt:
      'Constructive critique is vital for speech and writing mastery. Learn how to transform editorial feedback into an empowering learning loop for your child.',
    author: 'Priya Deshmukh',
    authorRole: 'Communication & Literature Coach',
    date: 'Sep 18, 2026',
    readTime: '5 min read',
    image: '/images/blog/english.jpg',
  },
  {
    id: 'post-4',
    category: 'Science For Kids',
    title: 'Reading Science Diagrams Is an Essential Skill — Here’s How to Teach It',
    excerpt:
      'Schematics, flowcharts, and cross-sections can feel abstract. Unpack step-by-step techniques to help children decipher scientific diagrams intuitively.',
    author: 'Dr. Meenakshi Sundaram',
    authorRole: 'Research Mentor & Science Pedagogy Lead',
    date: 'Sep 15, 2026',
    readTime: '8 min read',
    image: '/images/blog/science.jpg',
  },
  {
    id: 'post-5',
    category: 'Parenting Tips',
    title: 'Resetting the After-School Routine in the Middle of the Academic Term',
    excerpt:
      'When mid-semester burnout starts creeping in, a gentle restructuring of evening study, screen time, and hobbies brings back enthusiasm and balance.',
    author: 'Rohan Verma',
    authorRole: 'Child Development Counselor',
    date: 'Sep 12, 2026',
    readTime: '6 min read',
    image: '/images/blog/parenting_routine.jpg',
  },
  {
    id: 'post-6',
    category: 'Financial Literacy for Kids',
    title: 'Should You Pay Your Child for Doing Chores? A Smart Money Mindset Guide',
    excerpt:
      'Differentiating household responsibilities from earned income lays the groundwork for budgeting, delayed gratification, and financial autonomy.',
    author: 'Neha Banerjee',
    authorRole: 'Youth Financial Literacy Mentor',
    date: 'Sep 09, 2026',
    readTime: '7 min read',
    image: '/images/blog/chores_finance.jpg',
  },
  {
    id: 'post-7',
    category: 'Coding For Kids & Teens',
    title: 'Building First Games in Python: Why Game Logic Matters More Than Syntax',
    excerpt:
      'Teaching young coders game loops, coordinate grids, and condition states fosters computational thinking that transcends specific programming languages.',
    author: 'Arvind Swaminathan',
    authorRole: 'AI & Python Robotics Instructor',
    date: 'Sep 05, 2026',
    readTime: '8 min read',
    image: '/images/blog/python_game.jpg',
  },
  {
    id: 'post-8',
    category: 'Math For Kids',
    title: 'Mental Math vs. Rote Calculation: Strengthening Early Number Intuition',
    excerpt:
      'Visualizing patterns on number lines and breaking down numbers gives students the confidence to solve arithmetic problems mentally in seconds.',
    author: 'Pooja Nair',
    authorRole: 'Olympiad Math Mentor',
    date: 'Sep 02, 2026',
    readTime: '6 min read',
    image: '/images/blog/mental_math.jpg',
  },
  {
    id: 'post-9',
    category: 'Science For Kids',
    title: 'Everyday Kitchen Physics: 5 Simple Experiments That Demystify Forces',
    excerpt:
      'Turn pantry items into an interactive laboratory demonstrating gravity, surface tension, and kinetic energy without complex laboratory equipment.',
    author: 'Dr. Meenakshi Sundaram',
    authorRole: 'Research Mentor & Science Pedagogy Lead',
    date: 'Aug 29, 2026',
    readTime: '9 min read',
    image: '/images/blog/kitchen_physics.jpg',
  },
];

export const BlogSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All Articles');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const filteredPosts = useMemo(() => {
    return SAMPLE_BLOG_POSTS.filter((post) => {
      const matchesCategory =
        activeCategory === 'All Articles' || post.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <section id="blog" className="py-20 lg:py-28 bg-white border-t border-slate-200/80 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-50/60 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 1. Main Headline & 2. Subheadline / Tagline */}
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-100/90 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Codeyoung Perspectives</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Insights for Parents &amp; Young Learners
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Explore practical ideas, proven pedagogical strategies, and expert insights to help
            your child thrive in coding, math, English, science, and essential life skills.
            Authored by passionate educators and mentors who guide young minds every day.
          </p>
        </div>

        {/* Search Bar & Category Tabs */}
        <div className="mb-12 space-y-6">
          {/* Search Input */}
          <div className="max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search articles by topic, skill, or educator..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-2.5">
            {BLOG_CATEGORIES.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 ring-2 ring-indigo-600 ring-offset-2'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Sample Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-200 max-w-2xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No articles found</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Try adjusting your search query or selecting a different category tab.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('All Articles');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-14">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col justify-between overflow-hidden group p-5 sm:p-6"
              >
                <div>
                  {/* Article Thumbnail Image */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-5 bg-slate-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    {post.featured && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-md uppercase tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category Badge & Read Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-3">
                    {post.title}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                {/* Author & Date Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {post.author}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </div>

                  <span className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 5. Pagination / Load More */}
        <div className="flex items-center justify-center gap-2 mb-20">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
              currentPage === 1
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(2)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
              currentPage === 2
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(3)}
            className={`w-10 h-10 rounded-xl text-xs font-bold transition-colors ${
              currentPage === 3
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            3
          </button>
          <span className="px-2 text-slate-400 text-sm font-bold">&hellip;</span>
          <button
            type="button"
            onClick={() => setCurrentPage(30)}
            className="w-10 h-10 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            30
          </button>
        </div>

        {/* 6. Bottom CTA Section */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-indigo-800/40">
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center lg:text-left space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Live 1:1 Guided Mentorship</span>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Turn your child’s curiosity into creativity
              </h3>
              <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
                Book a personalized, 1:1 free trial session with our certified mentors to see how
                Codeyoung makes coding, math, English, and science fun, engaging, and transformative.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-indigo-300">
                <div className="flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>Call: </span>
                  <a href="tel:+918884459977" className="font-bold text-white hover:text-amber-300 transition-colors">
                    +91-88844-59977 (IN)
                  </a>
                </div>
                <span className="hidden sm:inline text-indigo-500">&bull;</span>
                <span className="text-indigo-200 font-medium">+1 Support Available</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0 w-full sm:w-auto">
              <Link
                to="/book"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-extrabold text-sm sm:text-base rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2"
              >
                <span>Book a Free 1:1 Trial Class</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[11px] text-indigo-300 text-center">
                Interactive 1:1 session &bull; 100% Free
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
