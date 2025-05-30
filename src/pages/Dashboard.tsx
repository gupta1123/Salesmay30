import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch, fetchUserInfo, fetchTeamInfo } from '../store';
import { ArrowLeftIcon, ChartBarIcon, MapIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { ClipLoader } from 'react-spinners';
import { Skeleton } from '@/components/ui/skeleton';
import EmployeeCard1 from './EmployeeCard1';
import EmployeeDetails from './EmployeeDetails';
import DateRangeDropdown from './DateRangeDropdown';
import maplibregl, { Map as MapLibreMap, NavigationControl, Marker, Popup } from 'maplibre-gl';
import axios, { AxiosResponse } from 'axios';
import 'maplibre-gl/dist/maplibre-gl.css';
import EmployeeLocationList from './EmployeeLocationList';
import './Dashboard.css';
import { motion } from 'framer-motion';

const API_BASE_URL = 'https://api.gajkesaristeels.in';
const MAP_STYLE_URL = 'https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json';
const OLA_CLIENT_ID = '7ba2810b-f481-4e31-a0c6-d436b0c7c1eb';
const OLA_CLIENT_SECRET = 'klymi04gaquWCnpa57hBEpMXR7YPhkLD';

type EmployeeLocation = {
  id: number;
  empId: number;
  empName: string;
  latitude: number;
  longitude: number;
  updatedAt: string;
  updatedTime: string;
};

type Visit = {
  id: number;
  employeeId: number;
  employeeFirstName: string;
  employeeLastName: string;
  employeeState: string;
  storeId: number;
  employeeName: string;
  purpose: string;
  storeName: string;
  visit_date: string;
  checkinTime: string;
  checkoutTime: string | null;
  statsDto: {
    completedVisitCount: number;
    fullDays: number;
    halfDays: number;
    absences: number;
  };
};

type StateCardProps = {
  state: string;
  totalEmployees: number;
  onClick: () => void;
};

const StateCard: React.FC<StateCardProps> = ({ state, totalEmployees, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={onClick}
      className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#1c1c28] to-[#1c1c28]/90 p-3 sm:p-4 hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-800"
    >
      <motion.div 
        className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          style={{ opacity: 0.1 }}
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0.1 }} />
            </linearGradient>
          </defs>
          <motion.path
            d="M 100, 100 m -75, 0 a 75,75 0 1,0 150,0 a 75,75 0 1,0 -150,0"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="20"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center space-x-2">
            <motion.div 
              className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg sm:rounded-xl backdrop-blur-sm"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <MapIcon className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
            </motion.div>
            <div>
              <motion.div 
                className="text-sm sm:text-base font-semibold text-white capitalize mb-0.5"
                animate={{
                  opacity: [0.9, 1, 0.9]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {state || 'Unknown State'}
              </motion.div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <motion.div 
                  className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className="text-blue-400 text-[10px] sm:text-xs">Active Region</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1 sm:mb-1.5">
              <span className="text-gray-400 text-[10px] sm:text-xs">Total Employees</span>
              <motion.span 
                className="text-xl sm:text-2xl font-bold text-white"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {totalEmployees}
              </motion.span>
            </div>
            <div className="relative h-1 sm:h-1.5 bg-blue-900/30 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 w-full h-full"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)"
                }}
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </div>
          </div>

          <motion.div 
            className="mt-2 sm:mt-3 flex items-center justify-between"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <motion.div 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <UserGroupIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500" />
              </motion.div>
              <span className="text-[10px] sm:text-xs text-gray-400">View Details</span>
            </div>
            <motion.div
              className="w-5 h-5 sm:w-6 sm:w-6 rounded-full bg-blue-500/10 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
            >
              <ArrowLeftIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-500 rotate-180" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

interface VisitResponse {
  statsDto: {
    visitCount: number;
    fullDays: number;
    halfDays: number;
    absences: number;
  };
  visitDto: Array<{
    id: number;
    storeName: string;
    checkinLatitude: number | null;
    checkinLongitude: number | null;
    visit_date: string;
    checkinTime: string;
    checkoutTime: string | null;
    purpose: string;
    city: string;
    state: string;
  }>;
}

const Dashboard: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOption, setSelectedOption] = useState('Today');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<{
    statsDto: { completedVisitCount: number, fullDays: number, halfDays: number, absences: number } | null,
    visitDto: Visit[] | null
  } | null>(null);
  const [isMainDashboard, setIsMainDashboard] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [employeeInfo, setEmployeeInfo] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<number[]>([]);
  const [employeeLocations, setEmployeeLocations] = useState<EmployeeLocation[]>([]);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [showMapLegend, setShowMapLegend] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const username = useSelector((state: RootState) => state.auth.username);
  const router = useRouter();
  const { view, state, employee, startDate: queryStartDate, endDate: queryEndDate } = router.query;
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    if (token && username && !role) {
      dispatch(fetchUserInfo(username));
    }
  }, [dispatch, token, username, role]);

  useEffect(() => {
    if (token) {
      getAccessToken();
      fetchEmployeeInfo();
    }
  }, [token]);

  useEffect(() => {
    if (token && role === 'MANAGER') {
      dispatch(fetchTeamInfo()).then((action) => {
        if (fetchTeamInfo.fulfilled.match(action) && action.payload) {
          const teamMemberIds = action.payload.fieldOfficers.map((officer: any) => officer.id);
          setTeamMembers(teamMemberIds);
        }
      });
    }
  }, [token, role, dispatch]);

  const fetchEmployeeInfo = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employee/getAll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeInfo(response.data);
    } catch (error) {
      console.error('Error fetching employee info:', error);
    }
  }, [token]);

  const fetchVisits = useCallback(async (start: string, end: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/report/getCounts?startDate=${start}&endDate=${end}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch visits: ${response.statusText}`);
      }

      const data = await response.json();
      if (role === 'MANAGER') {
        const filteredData = data.filter((visit: Visit) => teamMembers.includes(visit.employeeId));
        setVisits(filteredData);
      } else {
        setVisits(data);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
    } finally {
      setIsLoading(false);
    }
  }, [token, role, teamMembers]);

  const fetchEmployeeDetails = useCallback(async (employeeName: string, start: string, end: string) => {
    console.log('fetchEmployeeDetails called with:', { employeeName, start, end });
    setIsLoading(true);
    try {
      // First try to find employee in employeeInfo
      const employee = employeeInfo.find(emp => 
        `${emp.firstName} ${emp.lastName}`.toLowerCase() === employeeName.toLowerCase()
      );
      console.log('Employee from employeeInfo:', employee);

      // If not found in employeeInfo, try to find in visits
      const visitEmployee = visits.find(v => 
        `${v.employeeFirstName} ${v.employeeLastName}`.toLowerCase() === employeeName.toLowerCase()
      );
      console.log('Employee from visits:', visitEmployee);

      const employeeId = employee?.id || visitEmployee?.employeeId;
      console.log('Resolved employeeId:', employeeId);

      if (!employeeId) {
        console.error("Employee not found:", employeeName);
        console.log("Available employees in employeeInfo:", employeeInfo.map(emp => `${emp.firstName} ${emp.lastName}`));
        console.log("Available employees in visits:", visits.map(v => `${v.employeeFirstName} ${v.employeeLastName}`));
        throw new Error("Employee not found");
      }

      console.log("Fetching details for employee:", employeeName, "with ID:", employeeId);

      const url = `${API_BASE_URL}/visit/getByDateRangeAndEmployeeStats?id=${employeeId}&start=${start}&end=${end}`;
      console.log("Fetching from URL:", url);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch employee details: ${response.statusText}`);
        throw new Error(`Failed to fetch employee details: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Employee details data:', data);
      setEmployeeDetails(data);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      setEmployeeDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, [token, visits, employeeInfo]);

  useEffect(() => {
    if (!router.isReady) return; // Wait for router to be ready

    const { view, employee, state, startDate: queryStartDate, endDate: queryEndDate } = router.query;
    
    if (view === 'employeeDetails' && employee && state) {
      setSelectedState(state as string);
      setSelectedEmployee(employee as string);
      setIsMainDashboard(false);
      
      const start = queryStartDate as string || format(new Date(), 'yyyy-MM-dd');
      const end = queryEndDate as string || format(new Date(), 'yyyy-MM-dd');
      
      setStartDate(start);
      setEndDate(end);
      
      if (router.query.selectedOption) {
        setSelectedOption(router.query.selectedOption as string);
      } else {
        setSelectedOption(`${start},${end}`);
      }
      
      if (router.query.currentPage) {
        setCurrentPage(parseInt(router.query.currentPage as string, 10));
      }
      
      // Fetch employee details after setting all states
      fetchEmployeeDetails(employee as string, start, end);
    } else if (state) {
      setSelectedState(state as string);
      setIsMainDashboard(false);
    }
  }, [router.isReady, router.query, fetchEmployeeDetails]);

  useEffect(() => {
    if (token && role) {
      fetchVisits(startDate, endDate);
    }
  }, [token, role, startDate, endDate, fetchVisits]);

  useEffect(() => {
    const { reset } = router.query;
    if (reset === 'true') {
      setSelectedState(null);
      setSelectedEmployee(null);
      setCurrentPage(1);
      router.replace('/Dashboard', undefined, { shallow: true });
    }
  }, [router.query, router]);

  const handleEmployeeLocationClick = useCallback((location: EmployeeLocation) => {
    if (map.current) {
      setShowMapLegend(true);
      // Clear existing markers
      map.current.getCanvasContainer().querySelectorAll('.maplibregl-marker').forEach((marker) => {
        marker.remove();
      });

      Promise.all([
        axios.get(`${API_BASE_URL}/employee/getById?id=${location.empId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get<VisitResponse>(`${API_BASE_URL}/visit/getByDateRangeAndEmployeeStats`, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            id: location.empId,
            start: startDate,
            end: endDate
          }
        })
      ]).then(([employeeResponse, visitsResponse]) => {
        const employeeData = employeeResponse.data;
        const employeeName = `${employeeData.firstName} ${employeeData.lastName}`;
        const visits = visitsResponse.data.visitDto;
        const bounds = new maplibregl.LngLatBounds();

        // Calculate bounds first
        bounds.extend([location.longitude, location.latitude]);
        if (employeeData.houseLatitude && employeeData.houseLongitude) {
          bounds.extend([employeeData.houseLongitude, employeeData.houseLatitude]);
        }
        visits.forEach(visit => {
          if (visit.checkinLatitude && visit.checkinLongitude) {
            bounds.extend([visit.checkinLongitude!, visit.checkinLatitude!]);
          }
        });

        // Fit map immediately
        if (!bounds.isEmpty()) {
          map.current!.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 0
          });
        }

        // Add visit location pins with click popups
        visits.forEach((visit, index) => {
          if (visit.checkinLatitude && visit.checkinLongitude) {
            const visitMarker = new Marker({ color: '#3B82F6' })
              .setLngLat([visit.checkinLongitude!, visit.checkinLatitude!])
              .addTo(map.current!);
            
            const visitPopup = new Popup({
              closeButton: false,
              closeOnClick: false,
              className: 'map-popup',
              offset: [0, -10]
            });

            visitMarker.getElement().addEventListener('click', () => {
              // Remove any existing popups first
              map.current!.getCanvasContainer().querySelectorAll('.maplibregl-popup').forEach((popup) => {
                popup.remove();
              });

              visitPopup
                .setLngLat([visit.checkinLongitude!, visit.checkinLatitude!])
                .setHTML(`
                  <div class="popup-card">
                    <div class="popup-header">
                      <div class="popup-title-wrapper">
                        <div class="popup-title">
                          ${employeeName}
                          <div class="popup-badge visit">Visit #${index + 1}</div>
                        </div>
                      </div>
                    </div>
                    <div class="popup-body">
                      <div class="popup-info">
                        <div class="info-group">
                          <div class="store-name">${visit.storeName}</div>
                        </div>
                        <div class="time-info">
                          <div>Check-in Date: ${format(parseISO(visit.visit_date), 'MMM dd, yyyy')}</div>
                          <div>Check-in Time: ${format(parseISO(`${visit.visit_date}T${visit.checkinTime}`), 'h:mm a')}</div>
                          ${visit.checkoutTime ? 
                            `<div>Check-out: ${format(parseISO(`${visit.visit_date}T${visit.checkoutTime}`), 'h:mm a')}</div>` 
                            : '<div>Not checked out yet</div>'
                          }
                        </div>
                        ${visit.purpose ? `<div class="visit-purpose">${visit.purpose}</div>` : ''}
                        <div class="visit-location">${visit.city}, ${visit.state}</div>
                      </div>
                    </div>
                  </div>
                `)
                .addTo(map.current!);
            });
          }
        });

        // Add current location pin with click popup
        const currentMarker = new Marker({ color: '#22C55E' })
          .setLngLat([location.longitude, location.latitude])
          .addTo(map.current!);
        
        const currentPopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'map-popup',
          offset: [0, -10]
        });

        currentMarker.getElement().addEventListener('click', () => {
          // Remove any existing popups first
          map.current!.getCanvasContainer().querySelectorAll('.maplibregl-popup').forEach((popup) => {
            popup.remove();
          });

          currentPopup
            .setLngLat([location.longitude, location.latitude])
            .setHTML(`
              <div class="popup-card">
                <div class="popup-header">
                  <div class="popup-title-wrapper">
                    <div class="popup-title">
                      ${employeeName}
                      <div class="popup-badge current">Current Location</div>
                    </div>
                  </div>
                </div>
                <div class="popup-body">
                  <div class="popup-info">
                    <div class="time-info">
                      <div>Last seen at ${format(parseISO(`${location.updatedAt}T${location.updatedTime}`), 'h:mm a')}</div>
                    </div>
                  </div>
                </div>
              </div>
            `)
            .addTo(map.current!);
        });

        // Add home location pin with click popup
        if (employeeData.houseLatitude && employeeData.houseLongitude) {
          const homeMarker = new Marker({ color: '#EF4444' })
            .setLngLat([employeeData.houseLongitude, employeeData.houseLatitude])
            .addTo(map.current!);
          
          const homePopup = new Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'map-popup',
            offset: [0, -10]
          });

          homeMarker.getElement().addEventListener('click', () => {
            // Remove any existing popups first
            map.current!.getCanvasContainer().querySelectorAll('.maplibregl-popup').forEach((popup) => {
              popup.remove();
            });

            homePopup
              .setLngLat([employeeData.houseLongitude, employeeData.houseLatitude])
              .setHTML(`
                <div class="popup-card">
                  <div class="popup-header">
                    <div class="popup-title-wrapper">
                      <div class="popup-title">
                        ${employeeName}
                        <div class="popup-badge home">Home Location</div>
                      </div>
                    </div>
                  </div>
                  <div class="popup-body">
                    <div class="popup-info">
                      <div class="address">${employeeData.addressLine1 || 'Address not available'}</div>
                      <div class="location">${employeeData.city}, ${employeeData.state}</div>
                    </div>
                  </div>
                </div>
              `)
              .addTo(map.current!);
          });
        }
      });
    }
  }, [token, startDate, endDate]);

  const handleEmployeeClick = useCallback(async (employeeName: string) => {
    router.push({
      pathname: `/EmployeeDetailsPage/${encodeURIComponent(employeeName.trim().toLowerCase())}`,
      query: {
        state: selectedState,
      },
    });
  }, [router, selectedState]);

  const handleDateRangeChange = useCallback((start: string, end: string, option: string) => {
    setStartDate(start);
    setEndDate(end);
    setSelectedOption(option);

    if (selectedEmployee) {
      fetchEmployeeDetails(selectedEmployee, start, end);
      
      const selectedLocation = employeeLocations.find(loc => 
        loc.empName.toLowerCase() === selectedEmployee.toLowerCase()
      );
      
      if (selectedLocation) {
        handleEmployeeLocationClick(selectedLocation);
      }
    } else {
      fetchVisits(start, end);
    }
  }, [
    fetchEmployeeDetails, 
    fetchVisits, 
    selectedEmployee, 
    employeeLocations, 
    handleEmployeeLocationClick
  ]);

  const handleViewDetails = useCallback((visitId: number) => {
    // Save the current state before navigating
    const currentState = {
      returnTo: 'employeeDetails',
      state: selectedState,
      employee: selectedEmployee,
      startDate: startDate,
      endDate: endDate,
      selectedOption: selectedOption,
      currentPage: currentPage
    };

    // Store the state in localStorage
    localStorage.setItem('dashboardState', JSON.stringify(currentState));

    router.push({
      pathname: `/VisitDetailPage/${visitId}`,
      query: currentState
    });
  }, [router, selectedState, selectedEmployee, startDate, endDate, selectedOption, currentPage]);

  // Add a new useEffect to handle return navigation
  useEffect(() => {
    if (router.isReady) {
      const { returnTo } = router.query;
      
      if (returnTo === 'employeeDetails') {
        // Retrieve saved state from localStorage
        const savedState = localStorage.getItem('dashboardState');
        if (savedState) {
          const state = JSON.parse(savedState);
          setSelectedState(state.state);
          setSelectedEmployee(state.employee);
          setStartDate(state.startDate);
          setEndDate(state.endDate);
          setSelectedOption(state.selectedOption);
          setCurrentPage(state.currentPage);
          
          // Fetch employee details with saved state
          if (state.employee) {
            fetchEmployeeDetails(state.employee, state.startDate, state.endDate);
          }
          
          // Clear the saved state
          localStorage.removeItem('dashboardState');
        }
      }
    }
  }, [router.isReady, router.query, fetchEmployeeDetails]);

  const getAccessToken = useCallback(async () => {
    try {
      const response = await axios.post(
        'https://account.olamaps.io/realms/olamaps/protocol/openid-connect/token',
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'openid',
          client_id: OLA_CLIENT_ID,
          client_secret: OLA_CLIENT_SECRET
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      setAccessToken(response.data.access_token);
    } catch (error) {
      console.error('Error getting access token:', error);
    }
  }, []);

  const handleStateClick = useCallback((state: string) => {
    setSelectedState(state.trim().toLowerCase() || 'unknown');
    setSelectedEmployee(null);
    setIsMainDashboard(false);
    router.push({
      pathname: '/Dashboard',
      query: { state: state.trim().toLowerCase() || 'unknown' },
    }, undefined, { shallow: true });
  }, [router]);

  const handleBackToMainDashboard = useCallback(() => {
    setSelectedState(null);
    setSelectedEmployee(null);
    setIsMainDashboard(true);
    setMapError(null);
    setShowMapLegend(false);
    fetchAllEmployeeLocations();
    router.push('/Dashboard', undefined, { shallow: true });
  }, [router]);

  const initializeMap = useCallback(async (locations: EmployeeLocation[]) => {
    if (!mapContainer.current || !accessToken) return;

    try {
      // Clear existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      const styleResponse = await axios.get(MAP_STYLE_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const style = styleResponse.data;

      style.layers = style.layers.filter((layer: any) =>
        !['poi-vectordata', 'poi'].includes(layer.id)
      );

      // Create new map instance
      map.current = new MapLibreMap({
        container: mapContainer.current,
        style: style,
        center: [78.9629, 20.5937],
        zoom: 4,
        transformRequest: (url, resourceType) => {
          if (url.startsWith('https://api.olamaps.io')) {
            return {
              url: url,
              headers: {
                'Authorization': `Bearer ${accessToken}`
              },
            };
          }
        },
      });

      // Wait for map to load before adding markers
      await new Promise<void>((resolve) => {
        map.current!.on('load', () => {
          resolve();
        });
      });

      // Add navigation control
      map.current.addControl(new NavigationControl(), 'top-left');

      // Add markers for all locations
      locations.forEach(async (location, index) => {
        const color = `hsl(${(index * 137.508) % 360}, 70%, 50%)`;
        const marker = new Marker({ color: color })
          .setLngLat([location.longitude, location.latitude])
          .addTo(map.current!);

        // Create a popup but don't add it to the map yet
        const popup = new Popup({
          closeButton: false,
          closeOnClick: false,
          className: 'map-popup'
        });

        // Add click event to marker
        marker.getElement().addEventListener('click', async () => {
          try {
            const employeeResponse = await axios.get(`${API_BASE_URL}/employee/getById?id=${location.empId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const employeeData = employeeResponse.data;
            const employeeName = `${employeeData.firstName} ${employeeData.lastName}`;
            const lastUpdate = format(parseISO(`${location.updatedAt}T${location.updatedTime}`), 'MMM dd, yyyy');
            const lastUpdateTime = format(parseISO(`${location.updatedAt}T${location.updatedTime}`), 'h:mm a');

            popup
              .setLngLat([location.longitude, location.latitude])
              .setHTML(`
                <div class="popup-card">
                  <div class="popup-header">
                    <div class="popup-title-wrapper">
                      <div class="popup-title">
                        ${employeeName}
                        <div class="popup-badge current">Live Location</div>
                      </div>
                    </div>
                    <button class="popup-close" aria-label="Close popup">×</button>
                  </div>
                  <div class="popup-body">
                    <div class="popup-info">
                      <div class="info-section">
                        <div class="info-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                            <circle cx="12" cy="9" r="2.5"/>
                          </svg>
                        </div>
                        <div class="info-content">
                          <div class="info-label">Location Updated</div>
                          <div class="info-value">${lastUpdate} at ${lastUpdateTime}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `)
              .addTo(map.current!);

            // Add click handler for close button
            const closeButton = popup.getElement().querySelector('.popup-close');
            if (closeButton) {
              closeButton.addEventListener('click', () => popup.remove());
            }

            // Add mouseout handler to the popup
            popup.getElement().addEventListener('mouseout', (e) => {
              if (!popup.getElement().contains(e.relatedTarget as Node)) {
                popup.remove();
              }
            });
          } catch (error) {
            console.error('Error fetching employee details:', error);
          }
        });

        // Remove the mouseenter and mouseleave events
        // marker.getElement().addEventListener('mouseleave', () => {
        //   popup.remove();
        // });
      });

      // Fit bounds to show all markers
      if (locations.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        locations.forEach(location => {
          bounds.extend([location.longitude, location.latitude]);
        });
        map.current.fitBounds(bounds, { 
          padding: 50,
          maxZoom: 15 
        });
      }

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError("Failed to initialize map");
    }
  }, [accessToken, token]);

  const fetchAllEmployeeLocations = useCallback(async () => {
    setIsMapLoading(true);
    setMapError(null);
    setShowMapLegend(false);

    try {
      // Clear existing map instance
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      let locations: EmployeeLocation[] = [];

      if (role === 'MANAGER') {
        if (!teamMembers.length) {
          setEmployeeLocations([]);
          return;
        }

        const locationPromises = teamMembers.map((employeeId) =>
          axios.get(`${API_BASE_URL}/employee/getLiveLocation?id=${employeeId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(error => {
            console.log(`No live location for employee ${employeeId}`);
            return null;
          })
        );

        const locationResponses = await Promise.all(locationPromises);
        locations = locationResponses
          .filter((response): response is AxiosResponse<EmployeeLocation> => response !== null && response.data)
          .map((response) => response.data)
          .filter(location => location.latitude && location.longitude);

      } else {
        const employeesResponse = await axios.get(`${API_BASE_URL}/employee/getAll`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const locationPromises = employeesResponse.data.map((employee: any) =>
          axios.get(`${API_BASE_URL}/employee/getLiveLocation?id=${employee.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(error => {
            console.log(`No live location for employee ${employee.id}`);
            return null;
          })
        );

        const locationResponses = await Promise.all(locationPromises);
        locations = locationResponses
          .filter((response): response is AxiosResponse<EmployeeLocation> => response !== null && response.data)
          .map((response) => response.data)
          .filter(location => location.latitude && location.longitude);
      }

      // Sort locations alphabetically by employee name
      locations.sort((a, b) => a.empName.localeCompare(b.empName));

      setEmployeeLocations(locations);

      if (locations.length > 0 && accessToken) {
        // Wait for the DOM to update
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Initialize new map
        await initializeMap(locations);
      } else {
        setMapError("No employee locations available");
      }
    } catch (error) {
      console.error('Error fetching employee locations:', error);
      setMapError("Failed to fetch employee locations");
    } finally {
      setIsMapLoading(false);
    }
  }, [token, accessToken, role, teamMembers, initializeMap]);

  const fetchLatestVisit = useCallback(async (employeeName: string) => {
    const today = new Date();
    const startDate = today.getDate() <= 7 ? format(subDays(today, today.getDate() + 23), 'yyyy-MM-dd') : format(subDays(today, 30), 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    try {
      const response = await axios.get(`${API_BASE_URL}/visit/getByDateSorted`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: startDate,
          endDate: endDate,
          page: 0,
          size: 1,
          sort: 'visitDate,desc',
          employeeName: employeeName
        }
      });

      const visitData = response.data.content[0];
      return visitData;
    } catch (error) {
      console.error('Error fetching latest visit:', error);
      return null;
    }
  }, [token]);

  useEffect(() => {
    if (token && username && !role) {
      dispatch(fetchUserInfo(username));
    }
  }, [dispatch, token, username, role]);

  useEffect(() => {
    if (token) {
      getAccessToken();
    }
  }, [token, getAccessToken]);

  useEffect(() => {
    if (accessToken && isMainDashboard) {
      fetchAllEmployeeLocations();
    }
  }, [accessToken, fetchAllEmployeeLocations, isMainDashboard]);

  useEffect(() => {
    if (token && role) {
      fetchVisits(startDate, endDate);
    }
  }, [token, role, startDate, endDate, fetchVisits]);

  const stateCards = useMemo(() => {
    const stateData = visits.reduce((acc: { [key: string]: { employees: Set<string>, visits: number } }, visit) => {
      const state = (visit.employeeState || 'unknown').trim().toLowerCase();
      if (!acc[state]) {
        acc[state] = { employees: new Set(), visits: 0 };
      }
      if (visit.statsDto && visit.statsDto.completedVisitCount > 0) {
        acc[state].employees.add(`${visit.employeeFirstName || 'Unknown'} ${visit.employeeLastName || ''}`);
        acc[state].visits += visit.statsDto.completedVisitCount;
      }
      return acc;
    }, {});

    return Object.entries(stateData)
      .filter(([_, data]) => data.employees.size > 0)
      .map(([state, data]) => (
        <StateCard
          key={state}
          state={state.charAt(0).toUpperCase() + state.slice(1) || 'Unknown State'}
          totalEmployees={data.employees.size}
          onClick={() => handleStateClick(state)}
        />
      ));
  }, [visits, handleStateClick]);

  const employeeCards = useMemo(() => {
    if (!selectedState) return [];

    const stateVisits = visits.filter((visit) => (visit.employeeState.trim().toLowerCase() || 'unknown') === selectedState);
    const employeeVisits = stateVisits.reduce((acc: { [key: string]: any }, visit) => {
      const employeeName = visit.employeeFirstName + ' ' + visit.employeeLastName;
      if (!acc[employeeName] && visit.statsDto && visit.statsDto.completedVisitCount > 0) {
        acc[employeeName] = {
          ...visit,
          completedVisitCount: visit.statsDto.completedVisitCount
        };
      }
      return acc;
    }, {});

    return Object.entries(employeeVisits).map(([employeeName, employeeData]: [string, any]) => (
      <EmployeeCard1
        key={employeeName}
        employeeName={employeeName.charAt(0).toUpperCase() + employeeName.slice(1)}
        totalVisits={employeeData.completedVisitCount}
        onClick={() => handleEmployeeClick(employeeName)}
      />
    ));
  }, [selectedState, visits, handleEmployeeClick]);

  const renderSkeletonCards = () => (
    <>
      {[...Array(6)].map((_, index) => (
        <Card key={index}>
          <CardContent className="p-3 sm:p-6">
            <Skeleton className="h-3 sm:h-4 w-[150px] sm:w-[250px] mb-3 sm:mb-4" />
            <Skeleton className="h-3 sm:h-4 w-[120px] sm:w-[200px]" />
          </CardContent>
        </Card>
      ))}
    </>
  );

  const renderDashboardOverview = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c1c28] to-[#1c1c28]/90 hover:shadow-xl transition-all duration-300 group"
      >
        {/* Data Flow Animation */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-px bg-gradient-to-r from-transparent via-[#ff6b6b] to-transparent"
              style={{
                width: '100%',
                top: `${20 + i * 20}%`,
                left: '-100%'
              }}
              animate={{
                left: ['100%']
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "linear"
              }}
            />
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32">
          <motion.div 
            className="w-full h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.2 }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <linearGradient id="visitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ff6b6b', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#ff6b6b', stopOpacity: 0.2 }} />
                </linearGradient>
              </defs>
              
              {/* Data points grid */}
              {[...Array(6)].map((_, row) => (
                [...Array(6)].map((_, col) => (
                  <motion.circle
                    key={`${row}-${col}`}
                    cx={20 + col * 12}
                    cy={20 + row * 12}
                    r="1"
                    fill="#ff6b6b"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: (row + col) * 0.2,
                      ease: "easeInOut"
                    }}
                  />
                ))
              ))}

              {/* Connecting lines */}
              <motion.path
                d="M20,20 L80,80 M20,80 L80,20"
                stroke="url(#visitGrad)"
                strokeWidth="0.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10">
          <div className="flex items-center space-x-4 mb-6">
            <motion.div 
              className="p-3 bg-gradient-to-br from-[#ff6b6b] to-[#ff8585] rounded-2xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(255, 107, 107, 0.4)",
                  "0 0 0 20px rgba(255, 107, 107, 0)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChartBarIcon className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <motion.p 
                className="text-gray-400 text-base"
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Total Visits
              </motion.p>
              <p className="text-white/80 text-sm">Today&apos;s Overview</p>
            </div>
          </div>

          <div className="relative">
            <motion.div 
              className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b6b] to-[#ff8585]"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20
              }}
            >
              {visits.reduce((sum, visit) => sum + (visit.statsDto?.completedVisitCount || 0), 0)}
            </motion.div>
            
            {/* Animated dots */}
            <div className="absolute -right-2 top-0 flex space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#ff6b6b]"
                  animate={{
                    y: [-4, 4, -4],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <motion.div 
                className="flex items-center space-x-2 px-3 py-1.5 bg-[#ff6b6b]/10 rounded-full"
                whileHover={{ scale: 1.05 }}
                animate={{
                  backgroundColor: ["rgba(255,107,107,0.1)", "rgba(255,107,107,0.2)", "rgba(255,107,107,0.1)"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-[#ff6b6b]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <span className="text-[#ff6b6b] text-sm font-medium">Live Updates</span>
              </motion.div>
            </div>

            {/* Progress bars */}
            <div className="grid grid-cols-3 gap-2">
              {[0.8, 0.6, 0.4].map((progress, i) => (
                <div key={i} className="relative h-1 bg-[#ff6b6b]/20 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-[#ff6b6b] to-[#ff8585]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress * 100}%` }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.2,
                      ease: "easeOut"
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{
                      x: ['-100%', '100%']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c1c28] to-[#1c1c28]/90 hover:shadow-xl transition-all duration-300"
      >
        {/* Employee Network Animation */}
        <div className="absolute inset-0">
          <motion.div className="w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
              <defs>
                <linearGradient id="employeeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#4f46e5', stopOpacity: 0.2 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Central hub */}
              <motion.circle
                cx="50"
                cy="50"
                r="8"
                fill="#4f46e5"
                filter="url(#glow)"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              {/* Connection nodes */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <g key={angle}>
                  <motion.circle
                    cx={50 + 30 * Math.cos((angle * Math.PI) / 180)}
                    cy={50 + 30 * Math.sin((angle * Math.PI) / 180)}
                    r="4"
                    fill="#4f46e5"
                    initial={{ scale: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.line
                    x1="50"
                    y1="50"
                    x2={50 + 30 * Math.cos((angle * Math.PI) / 180)}
                    y2={50 + 30 * Math.sin((angle * Math.PI) / 180)}
                    stroke="url(#employeeGrad)"
                    strokeWidth="1"
                    initial={{ pathLength: 0 }}
                    animate={{
                      pathLength: [0, 1],
                      opacity: [0.3, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut"
                    }}
                  />
                </g>
              ))}

              {/* Pulse rings */}
              {[20, 35].map((radius, i) => (
                <motion.circle
                  key={radius}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="0.5"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [0.8, 1.2],
                    opacity: [0, 0.2, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-[#4f46e5] rounded-2xl">
              <UserGroupIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400">Active Employees</p>
              <p className="text-white/80">Team Overview</p>
            </div>
          </div>
          <motion.div 
            className="text-5xl font-bold text-white mb-4"
            animate={{
              scale: [1, 1.02, 1],
              opacity: [1, 0.9, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {new Set(visits.map(v => v.employeeId)).size}
          </motion.div>
          <div className="flex items-center space-x-3">
            <motion.span 
              className="px-3 py-1 bg-[#4f46e5]/20 text-[#4f46e5] rounded-full text-sm"
              animate={{
                backgroundColor: ["rgba(79,70,229,0.2)", "rgba(79,70,229,0.3)", "rgba(79,70,229,0.2)"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              Active Today
            </motion.span>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <motion.span 
                className="text-gray-400"
                animate={{
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                Activity Level
              </motion.span>
            </div>
            <div className="flex space-x-1">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="relative h-6 flex-1">
                  <motion.div 
                    className={`absolute bottom-0 w-full h-1 rounded-full ${i < 8 ? 'bg-[#4f46e5]' : 'bg-gray-700'}`}
                    animate={i < 8 ? {
                      height: ['4px', '16px', '4px'],
                      opacity: [0.7, 1, 0.7]
                    } : {}}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1
                    }}
                  >
                    {i < 8 && (
                      <motion.div
                        className="absolute inset-0 rounded-full bg-[#4f46e5]/20"
                        animate={{ 
                          scale: [1, 1.5, 1],
                          opacity: [0.2, 0.4, 0.2]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1
                        }}
                      />
                    )}
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#1c1c28] to-[#1c1c28]/90 hover:shadow-xl transition-all duration-300"
      >
        {/* Map Animation */}
        <div className="absolute inset-0">
          <motion.div className="w-full h-full">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-20">
              <defs>
                <linearGradient id="locationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0.2 }} />
                </linearGradient>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path
                    d="M 10 0 L 0 0 0 10"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                </pattern>
              </defs>

              {/* Background grid */}
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Location markers */}
              {[
                { x: 30, y: 30 },
                { x: 70, y: 40 },
                { x: 50, y: 60 },
                { x: 25, y: 70 },
                { x: 80, y: 65 }
              ].map((pos, i) => (
                <g key={i}>
                  {/* Pulse circle */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r="5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="0.5"
                    animate={{
                      scale: [1, 2],
                      opacity: [0.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeOut"
                    }}
                  />
                  
                  {/* Location pin */}
                  <motion.path
                    d={`M ${pos.x},${pos.y} m -4,-10 a 4,4 0 1,1 8,0 l -4,10 z`}
                    fill="#10b981"
                    initial={{ scale: 0 }}
                    animate={{
                      scale: [0, 1],
                      y: [0, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: "easeInOut"
                    }}
                  />
                </g>
              ))}

              {/* Radar sweep */}
              <motion.path
                d="M50,50 L50,20 A30,30 0 0,1 76.6,35"
                stroke="url(#locationGrad)"
                strokeWidth="2"
                fill="none"
                animate={{
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformOrigin: '50px 50px' }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-6 relative z-10">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-[#10b981] rounded-2xl">
              <MapIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-gray-400">Live Locations</p>
              <p className="text-white/80">GPS Tracking</p>
            </div>
          </div>
          <motion.div 
            className="text-5xl font-bold text-white mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {employeeLocations.length}
          </motion.div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-[#10b981]/20 text-[#10b981] rounded-full text-sm">
              Active now
            </span>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="h-2 bg-[#10b981]/30 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <motion.div
                  className="h-full bg-[#10b981] rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  const handleResetMap = useCallback(async () => {
    setIsMapLoading(true);
    try {
      // Clear existing map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }

      // Get fresh access token
      await getAccessToken();
      
      // Reset all states to initial values
      setSelectedState(null);
      setSelectedEmployee(null);
      setIsMainDashboard(true);
      setMapError(null);
      setShowMapLegend(false);

      // Fetch fresh data
      await Promise.all([
        fetchVisits(startDate, endDate),
        fetchAllEmployeeLocations()
      ]);

    } catch (error) {
      console.error('Error resetting map:', error);
      setMapError("Failed to reset map view");
    } finally {
      setIsMapLoading(false);
    }
  }, [getAccessToken, fetchVisits, fetchAllEmployeeLocations, startDate, endDate]);

  return (
    <div className="container-dashboard w-full max-w-[100vw] mx-auto py-4 sm:py-8 px-3 sm:px-4 overflow-x-hidden">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">
            {selectedState ? 
              (selectedState === 'unknown' ? 'Unknown State' : selectedState) 
              : 'Sales Dashboard'
            }
          </h1>
          <div className="flex items-center space-x-4">
            <DateRangeDropdown
              selectedOption={selectedOption}
              onDateRangeChange={handleDateRangeChange}
            />
            {selectedState && (
              <Button variant="outline" size="sm" onClick={handleBackToMainDashboard}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>

        {selectedState ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? renderSkeletonCards() : (
              employeeCards.length > 0 ? employeeCards : 
              <p className="col-span-full text-center text-muted-foreground">
                No employees with completed visits in this date range.
              </p>
            )}
          </div>
        ) : (
          <>
            {renderDashboardOverview()}
            <div className="mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 px-1">States Overview</h2>
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {isLoading ? renderSkeletonCards() : (
                  stateCards.length > 0 ? stateCards : 
                  <p className="col-span-full text-center text-muted-foreground text-sm sm:text-base">
                    No states with active employees in this date range.
                  </p>
                )}
              </div>
            </div>
            <div className="mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Live Employee Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  {isMapLoading ? (
                    <div className="flex justify-center items-center h-[600px]">
                      <ClipLoader color="#4A90E2" size={50} />
                    </div>
                  ) : (
                    <>
                      {employeeLocations.length > 0 ? (
                        <>
                          <div className="relative">
                            <div ref={mapContainer} className="rounded-lg border-2 border-gray-300 shadow-lg mb-4" style={{ width: '100%', height: '600px' }} />
                            <div className="absolute top-4 right-4 z-10">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                onClick={handleResetMap}
                                className="bg-white shadow-md hover:bg-gray-100 flex items-center gap-2"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="16" 
                                  height="16" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                  <path d="M3 3v5h5"/>
                                </svg>
                                Reset Map View
                              </Button>
                            </div>
                            {showMapLegend && (
                              <div className="absolute bottom-6 left-6 bg-white p-3 rounded-lg shadow-md">
                                <div className="text-sm font-semibold mb-2">Map Legend</div>
                                <div className="space-y-2">
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full bg-[#22C55E] mr-2"></div>
                                    <span>Current Location</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full bg-[#EF4444] mr-2"></div>
                                    <span>Home Location</span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full bg-[#3B82F6] mr-2"></div>
                                    <span>Visits</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          <EmployeeLocationList employeeLocations={employeeLocations} onEmployeeClick={handleEmployeeLocationClick} />
                        </>
                      ) : (
                        <div className="flex justify-center items-center h-[600px]">
                          <p className="text-muted-foreground">No live location data available</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;