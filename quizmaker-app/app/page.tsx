/**
 * Landing Page
 * Public homepage for QuizMaker application
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            QuizMaker
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create, Share, and Assess
            <span className="text-blue-600"> Knowledge</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A comprehensive quiz management platform for educators and learners.
            Create engaging quizzes, track progress, and measure success.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              For Instructors
            </h3>
            <p className="text-gray-600">
              Create and manage quizzes with ease. Add multiple-choice questions,
              set time limits, and track student performance.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              For Students
            </h3>
            <p className="text-gray-600">
              Take quizzes, get instant feedback, and track your progress.
              Multiple attempts allowed to improve your scores.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              For Admins
            </h3>
            <p className="text-gray-600">
              Monitor system activity, manage users, and access comprehensive
              analytics. Complete oversight of your platform.
            </p>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Powerful Features
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Multiple-Choice Questions</h4>
                <p className="text-gray-600">Create questions with 2-6 options</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Timed Quizzes</h4>
                <p className="text-gray-600">Set duration limits for assessments</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Instant Feedback</h4>
                <p className="text-gray-600">Immediate scoring and answer review</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Analytics Dashboard</h4>
                <p className="text-gray-600">Track performance and trends</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Role-Based Access</h4>
                <p className="text-gray-600">Student, Instructor, and Admin roles</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-green-600 text-2xl">✓</div>
              <div>
                <h4 className="font-semibold text-gray-900">Secure & Scalable</h4>
                <p className="text-gray-600">Built on Cloudflare infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">QuizMaker</div>
            <p className="text-gray-400 mb-4">
              Empowering education through technology
            </p>
            <div className="text-sm text-gray-500">
              &copy; 2025 QuizMaker. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

