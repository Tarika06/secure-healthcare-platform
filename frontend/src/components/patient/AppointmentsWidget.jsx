import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, Plus, HeartPulse, Stethoscope, ArrowRight } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';

const AppointmentsWidget = () => {
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateOffset, setDateOffset] = useState(0);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await appointmentApi.listAppointments();
                let fetchedAppointments = data.appointments || [];

                // Sort by date and time
                fetchedAppointments.sort((a, b) => {
                    const dateA = new Date(`${a.date}T${a.timeSlot ? a.timeSlot.split(' - ')[0] : '00:00'}`);
                    const dateB = new Date(`${b.date}T${b.timeSlot ? b.timeSlot.split(' - ')[0] : '00:00'}`);
                    return dateA - dateB;
                });

                setAppointments(fetchedAppointments);
            } catch (err) {
                console.error("Failed to load appointments", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    // Helper to get formatted day and number
    const getDays = () => {
        const days = [];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + dateOffset);

        for (let i = -3; i <= 3; i++) {
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + i);
            const isToday = date.toDateString() === new Date().toDateString();
            days.push({
                dayStr: date.toLocaleDateString('en-US', { weekday: 'short' }),
                dateNum: date.getDate(),
                isToday: isToday,
                isBase: i === 0 && !isToday
            });
        }
        return days;
    };

    const days = getDays();
    const currentBaseDate = new Date();
    currentBaseDate.setDate(currentBaseDate.getDate() + dateOffset);
    const currentMonthYear = currentBaseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Filter appointments (today vs upcoming)
    const currentViewAppointments = appointments.filter(a => {
        const aptDate = new Date(a.date);
        return aptDate.toDateString() === currentBaseDate.toDateString();
    });

    const upcomingAppointments = appointments.filter(a => {
        const aptDate = new Date(a.date);
        return aptDate > currentBaseDate && aptDate.toDateString() !== currentBaseDate.toDateString();
    });

    return (
        <div className="bg-[#1e1e1e] rounded-xl p-4 shadow-lg border border-slate-800 text-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setDateOffset(0)}
                    className="flex items-center gap-1 text-slate-100 font-bold text-base hover:text-white transition-colors">
                    {currentMonthYear}
                    {dateOffset !== 0 && <span className="ml-2 text-[10px] text-teal-500 font-medium px-2 py-0.5 bg-teal-500/10 rounded-full border border-teal-500/20">Back to Today</span>}
                </button>
                <button
                    onClick={() => navigate('/patient/dashboard?tab=appointments')}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-400 border border-teal-500/30 rounded-lg hover:bg-teal-500/10 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Add New
                </button>
            </div>

            {/* Layout Container */}
            <div className="flex flex-col gap-5">
                {/* Top Section: Calendar Strip */}
                <div className="flex flex-col items-center justify-center border-b border-slate-800 pb-5">
                    <div className="flex items-center justify-between gap-1.5 md:gap-2 w-full max-w-2xl">
                        <button onClick={() => setDateOffset(prev => prev - 7)} className="p-1.5 md:p-2 hover:bg-[#333] rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                        <div className="flex gap-1.5 md:gap-2 flex-1 justify-center overflow-x-auto py-1.5">
                            {days.map((d, index) => (
                                <div
                                    key={index}
                                    onClick={() => setDateOffset(dateOffset + (index - 3))}
                                    className={`flex flex-col items-center justify-center rounded-xl min-w-[3rem] w-12 md:w-14 h-14 transition-all cursor-pointer flex-shrink-0 ${d.isToday
                                        ? 'bg-[#00d0d0] text-slate-900 shadow-[0_3px_8px_rgba(0,208,208,0.3)] scale-105'
                                        : d.isBase
                                            ? 'bg-slate-700 text-white ring-1 ring-[#00d0d0]/50'
                                            : 'bg-[#2a2a2a] text-slate-400 hover:bg-[#333] hover:scale-105'
                                        }`}
                                >
                                    <span className={`text-[10px] md:text-xs font-semibold mb-0.5 ${d.isToday ? 'text-slate-800' : d.isBase ? 'text-slate-200' : 'text-slate-400'}`}>{d.dayStr}</span>
                                    <span className={`text-base md:text-lg font-bold ${d.isToday ? 'text-slate-900' : 'text-slate-200'}`}>{d.dateNum}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setDateOffset(prev => prev + 7)} className="p-1.5 md:p-2 hover:bg-[#333] rounded-lg text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Bottom Section: Schedule & Upcoming Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {/* Schedule Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                            <h3 className="text-slate-200 font-bold text-sm">Schedule for {currentBaseDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                            <button onClick={() => navigate('/patient/dashboard?tab=appointments')} className="text-[#00d0d0] text-xs font-semibold hover:text-[#00ffff]">See All</button>
                        </div>

                        {loading ? (
                            <div className="text-center py-5 text-xs text-slate-500">Loading schedule...</div>
                        ) : currentViewAppointments.length > 0 ? (
                            <div className="space-y-3 flex-1">
                                {currentViewAppointments.map((apt, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-[#2a2a2a]/50 hover:bg-[#2a2a2a] transition-colors cursor-pointer group border border-slate-800/50 hover:border-slate-700">
                                        <div className="w-10 h-10 rounded-xl bg-[#333] group-hover:bg-[#444] flex items-center justify-center shrink-0 border border-slate-700">
                                            <Stethoscope className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <p className="text-sm font-bold text-slate-200 truncate pr-2">{apt.reason || apt.doctor?.specialty || 'General Checkup'}</p>
                                                <p className="text-xs font-bold text-[#00d0d0] whitespace-nowrap bg-teal-500/10 px-2 py-0.5 rounded-md">{apt.timeSlot}</p>
                                            </div>
                                            <p className="text-xs text-slate-400 truncate">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col border border-dashed border-slate-800 rounded-xl items-center justify-center py-8 text-center bg-[#2a2a2a]/10 flex-1">
                                <p className="text-sm text-slate-500 font-medium">No appointments scheduled for this day.</p>
                            </div>
                        )}
                    </div>

                    {/* Upcoming Section */}
                    <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-3.5">
                            <h3 className="text-slate-200 font-bold text-sm">Upcoming Ahead</h3>
                        </div>

                        {loading ? (
                            <div className="text-center py-5 text-xs text-slate-500">Loading future appointments...</div>
                        ) : upcomingAppointments.length > 0 ? (
                            <div className="space-y-3 flex-1">
                                {upcomingAppointments.slice(0, 3).map((apt, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl bg-transparent hover:bg-[#2a2a2a] transition-colors cursor-pointer group border border-transparent hover:border-slate-800">
                                        <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] group-hover:bg-[#333] flex items-center justify-center shrink-0 border border-slate-700">
                                            {i % 2 === 0 ? <HeartPulse className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" /> : <Stethoscope className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-200 truncate">{apt.reason || apt.doctor?.specialty || 'Consultation'}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <p className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">{apt.timeSlot}</p>
                                                <span className="text-[10px] text-slate-500 font-medium">{new Date(apt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-1.5 truncate">Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col border border-dashed border-slate-800 rounded-xl items-center justify-center py-8 text-center bg-[#2a2a2a]/10 flex-1">
                                <p className="text-sm text-slate-500 font-medium">No upcoming appointments in the future.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppointmentsWidget;
