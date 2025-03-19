import { Link } from 'react-router-dom';
import { BookOpen, Brain, PenTool, Sparkles } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-[#FDF2F8]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF7A59]/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center relative">
            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[#FF7A59]/10 mb-8">
              <Sparkles className="h-5 w-5 text-[#FF7A59] mr-2" />
              <span className="text-sm font-medium text-[#FF7A59]">AI-Powered Note Generation</span>
            </div>
            <h1 className="text-4xl tracking-tight font-extrabold text-[#374151] sm:text-5xl md:text-6xl">
              <span className="block">Transform Your Learning with</span>
              <span className="block text-[#FF7A59] mt-2">OneNote</span>
            </h1>
            <p className="mt-6 max-w-md mx-auto text-lg text-[#374151]/80 sm:text-xl md:mt-8 md:text-2xl md:max-w-3xl">
              Generate smart, concise notes on any topic. Perfect for students, researchers, and lifelong learners.
            </p>
            <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12">
              <div className="rounded-xl shadow-lg">
                <Link
                  to="/signup"
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-[#FF7A59] hover:bg-[#FF7A59]/90 md:py-5 md:text-lg md:px-12 transition-all duration-200 transform hover:scale-105"
                >
                  Get Started Free
                </Link>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-4">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center px-8 py-4 border-2 border-[#FF7A59] text-base font-medium rounded-xl text-[#FF7A59] bg-white hover:bg-[#FF7A59]/5 md:py-5 md:text-lg md:px-12 transition-all duration-200 transform hover:scale-105"
                >
                  Log In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#374151] sm:text-4xl">
              Why Choose OneNote?
            </h2>
            <p className="mt-4 text-lg text-[#374151]/70">
              Experience the future of note-taking with our powerful features
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3">
            {/* Feature 1 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#FF7A59]/5 to-transparent rounded-2xl transform transition-transform duration-300 group-hover:scale-105"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="bg-[#FF7A59]/10 p-4 rounded-xl w-fit mb-6">
                  <BookOpen className="h-8 w-8 text-[#FF7A59]" />
                </div>
                <h3 className="text-xl font-semibold text-[#374151] mb-4">Smart Notes</h3>
                <p className="text-[#374151]/70 leading-relaxed">
                  Generate comprehensive notes on any topic with our advanced AI technology. Save time and focus on learning.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#3B82F6]/5 to-transparent rounded-2xl transform transition-transform duration-300 group-hover:scale-105"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="bg-[#3B82F6]/10 p-4 rounded-xl w-fit mb-6">
                  <Brain className="h-8 w-8 text-[#3B82F6]" />
                </div>
                <h3 className="text-xl font-semibold text-[#374151] mb-4">Customizable Length</h3>
                <p className="text-[#374151]/70 leading-relaxed">
                  Choose your preferred word count for perfectly sized summaries. Get exactly what you need, every time.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-[#FACC15]/5 to-transparent rounded-2xl transform transition-transform duration-300 group-hover:scale-105"></div>
              <div className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="bg-[#FACC15]/10 p-4 rounded-xl w-fit mb-6">
                  <PenTool className="h-8 w-8 text-[#FACC15]" />
                </div>
                <h3 className="text-xl font-semibold text-[#374151] mb-4">Easy Export</h3>
                <p className="text-[#374151]/70 leading-relaxed">
                  Download your notes in multiple formats for easy sharing and reference. Access your notes anywhere, anytime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#FF7A59] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Transform Your Learning?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Join thousands of students and professionals who are already using OneNote
            </p>
            <div className="mt-8">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-base font-medium rounded-xl text-[#FF7A59] bg-white hover:bg-white/90 md:py-5 md:text-lg md:px-12 transition-all duration-200 transform hover:scale-105"
              >
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}