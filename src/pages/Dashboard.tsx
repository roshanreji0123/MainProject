//edited
import { useState, useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Download, Loader2, User, FileText, Sparkles, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { ProtectedRoute } from '../components/ProtectedRoute';

export function Dashboard() {
  const [topic, setTopic] = useState('');
  const [noteLength, setNoteLength] = useState<'short' | 'long'>('short');
  const [notes, setNotes] = useState<string>('');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'notes' | 'profile'>('notes');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const { user, updateUserName, incrementNotesCount } = useUser();
  const { resetToLightMode } = useTheme();

  useEffect(() => {
    // Reset to light mode when dashboard mounts
    resetToLightMode();
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setNotes('');
    setPdfPath(null);

    try {
      const response = await fetch('/api/generate_notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topic, preference: noteLength }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate notes');
      }

      if (data.pdf_path) {
        setPdfPath(data.pdf_path);
        setNotes('PDF generated successfully! Click the link below to download.');
        incrementNotesCount();
      } else {
        throw new Error(data.error || 'PDF path not found in response.');
      }

    } catch (error: any) {
      console.error('Error generating notes:', error);
      setNotes(`Failed to generate notes: ${error.message}`);
      setPdfPath(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (newName.trim()) {
      try {
        await updateUserName(newName.trim());
        setIsEditingName(false);
        setNewName('');
      } catch (error) {
        console.error('Error updating name:', error);
      }
    }
  };

  return (
    <ProtectedRoute>
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection}>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            {activeSection === 'notes' ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-8">
                  <div className="flex items-center mb-8">
                    <div className="bg-[#FF7A59]/10 dark:bg-[#FF7A59]/20 p-3 rounded-lg">
                      <Sparkles className="h-6 w-6 text-[#FF7A59]" />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-2xl font-bold text-[#374151] dark:text-white">Generate Notes</h2>
                      <p className="text-[#374151]/70 dark:text-gray-400">Create comprehensive notes on any topic</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative">
                      <label htmlFor="topic" className="block text-sm font-medium text-[#374151] dark:text-gray-200 mb-2">
                        What would you like to learn about?
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Sparkles className="h-5 w-5 text-[#FF7A59]" />
                        </div>
                        <input
                          type="text"
                          id="topic"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-sm focus:border-[#FF7A59] focus:ring-2 focus:ring-[#FF7A59]/20 focus:outline-none text-base transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-[#374151] dark:text-gray-200"
                          placeholder="e.g., Quantum Physics, World History, Machine Learning"
                        />
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                          <div className="text-xs text-[#374151]/60 dark:text-gray-400 font-medium">
                            {topic.length}/50
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-[#374151]/70 dark:text-gray-400">
                        Enter any topic you want to explore and generate comprehensive notes about it.
                      </p>
                    </div>

                    <div className="bg-[#FDF2F8] dark:bg-gray-800/50 rounded-xl p-6">
                      <label className="block text-sm font-medium text-[#374151] dark:text-gray-200 mb-3">
                        Note Length
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setNoteLength('short')}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            noteLength === 'short'
                              ? "bg-[#FF7A59] text-white"
                              : "bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                          )}
                        >
                          Short (~200 words)
                        </button>
                        <button
                          onClick={() => setNoteLength('long')}
                          className={cn(
                            "px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                            noteLength === 'long'
                              ? "bg-[#FF7A59] text-white"
                              : "bg-white dark:bg-gray-700 text-[#374151] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                          )}
                        >
                          Long (~800 words)
                        </button>
                      </div>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={handleGenerate}
                        disabled={loading || !topic}
                        className={cn(
                          "inline-flex items-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-[#FF7A59] hover:bg-[#FF7A59]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7A59] transition-all duration-200 transform hover:scale-105",
                          (loading || !topic) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Generate Notes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {notes && (
                  <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-8">
                    <h3 className="text-lg font-medium text-[#374151] dark:text-gray-200 mb-4">Generation Status</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                      <p className="text-sm text-[#374151] dark:text-gray-300">
                        {notes}
                      </p>
                      {pdfPath && (
                        <a
                          href={pdfPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF7A59] hover:bg-[#FF7A59]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF7A59] transition-all duration-200"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-8">
                  <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-r from-[#FF7A59]/10 to-[#3B82F6]/10 dark:from-[#FF7A59]/20 dark:to-[#3B82F6]/20 rounded-2xl p-8 mb-8">
                      <div className="flex items-center space-x-6">
                        <div className="bg-[#FF7A59]/10 dark:bg-[#FF7A59]/20 p-6 rounded-full">
                          <User className="h-12 w-12 text-[#FF7A59]" />
                        </div>
                        <div className="flex-1">
                          {isEditingName ? (
                            <div className="flex items-center space-x-2 w-full">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FF7A59] focus:ring-[#FF7A59] text-base py-2 px-3 text-[#374151] dark:text-gray-200 bg-white dark:bg-gray-800"
                                  placeholder="Enter new name"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={handleUpdateName}
                                className="p-2 text-[#FF7A59] hover:text-[#FF7A59]/80 bg-white dark:bg-gray-800 rounded-lg hover:bg-[#FF7A59]/10 dark:hover:bg-[#FF7A59]/20 transition-colors"
                              >
                                <Check className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingName(false);
                                  setNewName('');
                                }}
                                className="p-2 text-[#374151]/60 dark:text-gray-400 hover:text-[#374151] dark:hover:text-gray-200 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <h2 className="text-2xl font-bold text-[#374151] dark:text-white">{user?.name}</h2>
                              <button
                                onClick={() => setIsEditingName(true)}
                                className="p-1 text-[#374151]/40 dark:text-gray-500 hover:text-[#FF7A59] transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          <p className="text-[#374151]/70 dark:text-gray-400 mt-1">{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="bg-[#3B82F6]/10 dark:bg-[#3B82F6]/20 p-3 rounded-lg">
                            <User className="h-6 w-6 text-[#3B82F6]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-[#374151]/70 dark:text-gray-400">Account Status</h3>
                            <div className="flex items-center space-x-2">
                              <div className="h-2 w-2 bg-[#3B82F6] rounded-full"></div>
                              <p className="text-sm font-medium text-[#374151] dark:text-gray-200">Active</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="bg-[#FACC15]/10 dark:bg-[#FACC15]/20 p-3 rounded-lg">
                            <FileText className="h-6 w-6 text-[#FACC15]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-[#374151]/70 dark:text-gray-400">Notes Generated</h3>
                            <p className="text-2xl font-bold text-[#374151] dark:text-gray-200">{user?.notesCount || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Navigation>
    </ProtectedRoute>
  );
}