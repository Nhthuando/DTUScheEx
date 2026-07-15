import { useState, useEffect, useMemo } from 'react';

const RoomsList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 5;

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/exams/allSche');
      const data = await res.json();
      if (res.ok) {
        setRooms(data.data);
      } else {
        setError(data.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('http://localhost:5000/api/exams/scrape');
      const data = await res.json();
      if (res.ok) {
        await fetchRooms();
      } else {
        alert(data.message || 'Lỗi khi đồng bộ dữ liệu');
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ khi đồng bộ');
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredRooms = useMemo(() => {
    let result = rooms;
    if (searchQuery) {
      result = result.filter(room => 
        room.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [rooms, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading && !isSyncing && rooms.length === 0) return (
    <div className="w-full flex flex-col items-center justify-center py-20">
      <div className="loader mb-4"></div>
      <p className="text-white/50 text-sm">Đang tải danh sách phòng thi...</p>
    </div>
  );
  
  if (error) return <div className="text-red-400 text-center py-20 bg-red-400/10 border border-red-400/20 rounded-xl w-full max-w-4xl mx-auto">{error}</div>;

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-white tracking-tight font-['SF_Pro_Display',_sans-serif]">Danh sách lịch thi</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[300px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <input 
              type="text" 
              placeholder="Tìm môn học..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1A1A1D] border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:border-white/30 focus:outline-none transition-colors"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 border border-transparent rounded-lg text-sm text-white transition-colors shadow-sm whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed font-medium">
            {isSyncing ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6"/><path d="M3 12a9 9 0 1 0 2.13-5.88L2 9"/>
              </svg>
            )}
            {isSyncing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {currentRooms.map((period, index) => {
           const dateObj = new Date(period.scrapedAt || period.createdAt || Date.now());
           const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
           const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
           return (
            <div key={index} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#141416]/90 hover:bg-[#1a1a1d] border border-white/5 rounded-xl transition-all shadow-sm hover:shadow-md hover:border-white/10 gap-4 sm:gap-0">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center bg-[#1A1A1D] text-white/50 group-hover:text-accent transition-colors shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-white/90 text-[15px] truncate max-w-[300px] md:max-w-[400px]">{period.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 justify-between sm:justify-end border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                <div className="text-right">
                  <div className="font-medium text-white/90 text-sm tracking-wide">Cập nhật lúc {timeStr}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{dateStr}</div>
                </div>
                <a href={period.sourceUrl} target="_blank" rel="noreferrer" className="text-white/20 hover:text-accent transition-colors p-2 rounded-full hover:bg-accent/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            </div>
           )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-10 text-sm pb-10">
          <span className="text-white/50 mr-2 text-sm">Trang</span>
          
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-9 h-9 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors flex items-center justify-center border border-transparent hover:border-white/10 mr-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button 
              key={page}
              onClick={() => handlePageChange(page)}
              className={`w-9 h-9 rounded flex items-center justify-center transition-colors border ${
                currentPage === page 
                  ? 'bg-accent text-white font-medium shadow-lg shadow-accent/20 border-transparent' 
                  : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border-transparent hover:border-white/10'
              }`}
            >
              {page}
            </button>
          ))}

          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-9 h-9 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors flex items-center justify-center border border-transparent hover:border-white/10 ml-1 disabled:opacity-50 disabled:cursor-not-allowed">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default RoomsList;
