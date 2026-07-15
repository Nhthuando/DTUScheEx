import { useState } from 'react';
import ShaderBackground from './ShaderBackground';
import RoomsList from './RoomsList';

const App = () => {
  const [maMonHoc, setMaMonHoc] = useState('');
  const [maSinhVien, setMaSinhVien] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentTab, setCurrentTab] = useState('search');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!maMonHoc || !maSinhVien) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    setLoadingMessage('Đang kiểm tra môn học...');

    try {
      // 1. findCourse
      const res1 = await fetch('http://localhost:5000/api/exams/findCourse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maMonHoc }),
      });
      const data1 = await res1.json().catch(() => null);
      if (!res1.ok) {
        throw new Error(data1?.message || data1?.error || 'Chưa tồn tại lịch thi môn học này');
      }

      // 2. getExamSchedule
      setLoadingMessage('Đang đồng bộ dữ liệu phòng thi...');
      const res2 = await fetch('http://localhost:5000/api/exams/getExamSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: data1.sourceUrl }),
      });
      const data2 = await res2.json().catch(() => null);
      if (!res2.ok) {
        throw new Error(data2?.message || data2?.error || 'Lỗi khi đồng bộ dữ liệu lịch thi');
      }

      // 3. findExamSchedule
      setLoadingMessage('Đang tra cứu thông tin sinh viên...');
      const res3 = await fetch('http://localhost:5000/api/exams/findExamSchedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maMonHoc, maSinhVien }),
      });
      const data3 = await res3.json().catch(() => null);
      if (!res3.ok) {
        throw new Error(data3?.message || data3?.error || 'Không tìm thấy phòng thi cho sinh viên này');
      }

      setResults(data3.data);
    } catch (err) {
      if (err.message === 'Failed to fetch') {
        setError('Không thể kết nối đến máy chủ (Máy chủ có thể chưa bật)');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <>
      <ShaderBackground />
      <div className="min-h-screen flex flex-col relative z-10">
        <header className="glass-nav sticky top-0 z-50 px-6 py-4 flex justify-between items-center transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
              DTUScheEx <span className="text-sm font-medium text-white/50 ml-1">- By NgoHuuThuan</span>
            </span>
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-medium text-white/70">
            <button 
              onClick={() => setCurrentTab('search')}
              className={`transition-colors ${currentTab === 'search' ? 'text-white' : 'hover:text-white'}`}>Tra cứu</button>
            <button 
              onClick={() => setCurrentTab('rooms')}
              className={`transition-colors ${currentTab === 'rooms' ? 'text-white' : 'hover:text-white'}`}>Phòng thi</button>
          </nav>
        </header>

        <main className="flex-1 flex flex-col items-center pt-24 md:pt-32 px-4 pb-20 w-full max-w-5xl mx-auto">
          {currentTab === 'search' ? (
            <>
              <div className="text-center mb-16 animate-fade-in-up">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
                  <span className="text-white drop-shadow-md">Tra cứu phòng thi</span><br/>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-purple to-pink-500 drop-shadow-xl">
                    Đại học Duy Tân
                  </span>
                </h1>
                <p className="text-white/60 text-lg md:text-xl font-light tracking-wide max-w-xl mx-auto">
                  Trải nghiệm hệ thống tra cứu thế hệ mới. Tìm kiếm thông tin chính xác, tiện lợi và nhanh chóng.
                </p>
              </div>

              <div className="glass-card w-full max-w-4xl p-8 mb-12 transform transition-all duration-500 hover:shadow-2xl">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-accent transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 2.5 0 0 1 0-5H20"/></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Mã môn học (VD: MED 705 SA)" 
                      value={maMonHoc}
                      onChange={(e) => setMaMonHoc(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 rounded-xl text-sm font-medium placeholder-white/30"
                    />
                  </div>
                  <div className="flex-1 relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-purple transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Mã sinh viên (VD: 26205339251)" 
                      value={maSinhVien}
                      onChange={(e) => setMaSinhVien(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 rounded-xl text-sm font-medium placeholder-white/30"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="btn-glow relative bg-dark border border-white/10 px-8 py-4 rounded-full font-semibold text-white flex items-center justify-center min-w-[140px] hover:bg-white/5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <div className="loader"></div> : "Tra cứu"}
                  </button>
                </form>
                
                {loading && (
                  <div className="mt-6 text-accent text-sm text-center font-medium bg-accent/10 py-3 rounded-lg border border-accent/20 flex items-center justify-center gap-3">
                    {loadingMessage}
                  </div>
                )}

                {error && (
                  <div className="mt-6 text-red-400 text-sm text-center font-medium bg-red-400/10 py-3 rounded-lg border border-red-400/20">
                    {error}
                  </div>
                )}
              </div>

              {results && results.length > 0 && (
                <div className="w-full max-w-4xl flex flex-col gap-6 animate-fade-in-up">
                  {results.map((result, index) => {
                    const sche = result.examSchedule;
                    return (
                      <div key={index} className="glass-card overflow-hidden flex flex-col group hover:-translate-y-1 transition-transform duration-300">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5 group-hover:bg-white/10 transition-colors">
                          <div>
                            <h3 className="font-semibold text-lg tracking-tight text-white">{sche.courseCode}</h3>
                            <p className="text-xs text-white/50 mt-0.5">{sche.courseName}</p>
                          </div>
                          <div className="bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                            Lần thi: {sche.examAttempt || 1}
                          </div>
                        </div>
                        <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-white/40">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{new Date(sche.examDate).toLocaleDateString('vi-VN')}</p>
                              <p className="text-xs text-white/50">Thời gian: {sche.startTime}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-white/40">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{sche.room}</p>
                              {sche.location && <p className="text-xs text-white/50">{sche.location}</p>}
                            </div>
                          </div>
                          {sche.group && (
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 text-white/40">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">Nhóm lớp: {sche.group}</p>
                              </div>
                            </div>
                          )}
                          {result.note && (
                            <div className="md:col-span-3 mt-2 text-xs bg-red-500/10 text-red-300 p-2 rounded border border-red-500/20">
                              Ghi chú: {result.note}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <RoomsList />
          )}
        </main>
      </div>
    </>
  );
};

export default App;
