import React, { useState, useEffect, useCallback} from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Script from 'next/script';
import axios from 'axios';
import Sites from './Sites';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import EditCustomerModal from './EditCustomerModal';
import CreateRequirementModal from './CreateRequirementModal';
import CreateComplaintModal from './CreateComplaintModal';
import { Button, Modal, Input, message, DatePicker, Form, Select, Dropdown, Menu } from 'antd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import './CustomerDetail.css';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const { TextArea } = Input;
const { Option } = Select;

const ITEMS_PER_PAGE = 3;

const CustomerDetailPage = () => {
  const router = useRouter();
  const { storeId } = router.query;
  const [customerData, setCustomerData] = useState<any>(null);
  const [notesData, setNotesData] = useState<Note[]>([]);
  const [visitsData, setVisitsData] = useState<Visit[]>([]);
  const [requirementsData, setRequirementsData] = useState<any[]>([]);
  const [complaintsData, setComplaintsData] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
   const [editingTask, setEditingTask] = useState<any>(null);
  const [activeInfoTab, setActiveInfoTab] = useState('leads-info');
  const [isEditCustomerModalVisible, setIsEditCustomerModalVisible] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [activeActivityTab, setActiveActivityTab] = useState('visits');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isVisitModalVisible, setIsVisitModalVisible] = useState(false);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(addDays(new Date(), 5));
  const [visitForm] = Form.useForm();
  const token = useSelector((state: RootState) => state.auth.token);
  const employeeId = useSelector((state: RootState) => state.auth.employeeId);
  const [showSitesTab, setShowSitesTab] = useState(false);
  const [showMore, setShowMore] = useState({
    visits: false,
    notes: false,
    complaints: false,
    requirements: false,
  });

  const [currentPage, setCurrentPage] = useState({
    visits: 1,
    notes: 1,
    complaints: 1,
    requirements: 1,
  });

  interface Visit {
    id: number;
    purpose: string;
    visit_date: string;
    employeeId: number;
    employeeName: string;
    // Add other fields as necessary
  }

  const [filteredVisitsData, setFilteredVisitsData] = useState<Visit[]>([]);

  const [intentData, setIntentData] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);

  interface Note {
    id: number;
    content: string;
    createdDate: string;
    // Add other fields as necessary
  }




  const getToken = (): string => {
    return token || '';
  };
  const fetchIntentData = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/intent-audit/getByStore?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setIntentData(response.data);
    } catch (error) {
      console.error('Error fetching intent data:', error);
    }
  }, [token]);

  const fetchSalesData = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/monthly-sale/getByStore?storeId=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSalesData(response.data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  }, [token]);

  const handleCustomerEditSubmit = async (values: any) => {
    try {
      await axios.put(`https://api.gajkesaristeels.in/store/edit?id=${storeId}`, {
        ...values,
        storeId: parseInt(storeId as string),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCustomerData(values);
      setIsEditCustomerModalVisible(false);
      message.success('Customer updated successfully!');
    } catch (error) {
      console.error('Error updating customer:', error);
      message.error('Error updating customer.');
    }
  };

  const fetchCustomerData = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/store/getById?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCustomerData(response.data);

      // Set the visibility of the Sites tab based on clientType
      const validClientTypes = ['builder', 'site visit', 'architect', 'engineer'];
      setShowSitesTab(validClientTypes.includes(response.data.clientType.toLowerCase()));
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  }, [token]);


  const fetchNotesData = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/notes/getByStore?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setNotesData(response.data);
    } catch (error) {
      console.error('Error fetching notes data:', error);
    }
  }, [token]);


  const fetchVisitsData = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/visit/getByStore?id=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setVisitsData(response.data);
      setFilteredVisitsData(response.data);
    } catch (error) {
      console.error('Error fetching visits data:', error);
    }
  }, [token]);

  const fetchRequirementsData = useCallback(async (id: string, start: Date, end: Date) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/task/getByStoreAndDate?storeId=${id}&start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequirementsData(response.data.filter((task: any) => task.taskType === 'requirement'));
    } catch (error) {
      console.error('Error fetching requirements data:', error);
    }
  }, [token]);


  const fetchComplaintsData = useCallback(async (id: string, start: Date, end: Date) => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/task/getByStoreAndDate?storeId=${id}&start=${start.toISOString().split('T')[0]}&end=${end.toISOString().split('T')[0]}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComplaintsData(response.data.filter((task: any) => task.taskType === 'complaint'));
    } catch (error) {
      console.error('Error fetching complaints data:', error);
    }
  }, [token]);


  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get('https://api.gajkesaristeels.in/employee/getAll', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [token]);

  const fetchStores = useCallback(async () => {
    try {
      const response = await axios.get('https://api.gajkesaristeels.in/store/names', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStores(response.data);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  }, [token]);

  const getStoreId = (): string => {
    if (typeof storeId === 'string') {
      return storeId;
    }
    if (Array.isArray(storeId)) {
      return storeId[0];
    }
    return '';
  };
  const handleAddNote = async () => {
    try {
      const response = await axios.post('https://api.gajkesaristeels.in/notes/create', {
        content: noteContent,
        employeeId: employeeId,
        storeId: parseInt(storeId as string),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotesData([...notesData, response.data]);
      setNoteContent('');
      setIsModalVisible(false);
      message.success('Note added successfully!');
    } catch (error) {
      console.error('Error creating note:', error);
      message.error('Error creating note.');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setIsEditMode(true);
    setIsModalVisible(true);
  };

  const handleSaveEditNote = async () => {
    try {
      await axios.put(`https://api.gajkesaristeels.in/notes/edit?id=${editingNoteId}`, {
        content: noteContent,
        employeeId: employeeId,
        storeId: parseInt(storeId as string),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedNotes = notesData.map(note => note.id === editingNoteId ? { ...note, content: noteContent } : note);
      setNotesData(updatedNotes);
      setEditingNoteId(null);
      setNoteContent('');
      setIsEditMode(false);
      setIsModalVisible(false);
      message.success('Note updated successfully!');
    } catch (error) {
      console.error('Error updating note:', error);
      message.error('Error updating note.');
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      await axios.delete(`https://api.gajkesaristeels.in/notes/delete?id=${noteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotesData(notesData.filter(note => note.id !== noteId));
      message.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      message.error('Error deleting note.');
    }
  };

  const handleVisitFormSubmit = async (values: any) => {
    try {
      const response = await axios.post('https://api.gajkesaristeels.in/visit/create', {
        ...values,
        employeeId: employeeId,
        storeId: parseInt(storeId as string),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVisitsData([...visitsData, response.data]);
      setIsVisitModalVisible(false);
      visitForm.resetFields();
      message.success('Visit created successfully!');
    } catch (error) {
      console.error('Error creating visit:', error);
      message.error('Error creating visit.');
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === "All Statuses") {
      setFilteredVisitsData(visitsData); // Show all visits
    } else {
      setFilteredVisitsData(visitsData.filter(visit => getOutcomeStatus(visit).status === value));
    }
  };

  const handlePageChange = (tab: keyof typeof currentPage, page: number) => {
    setCurrentPage(prev => ({ ...prev, [tab]: page }));
  };

  const renderPaginationItems = (tab: keyof typeof currentPage) => {
    const items = [];
    let dataLength;

    // Determine the length of the data array for the current tab
    switch (tab) {
      case 'visits':
        dataLength = visitsData.length;
        break;
      case 'notes':
        dataLength = notesData.length;
        break;
      case 'complaints':
        dataLength = complaintsData.length;
        break;
      case 'requirements':
        dataLength = requirementsData.length;
        break;
      default:
        dataLength = 0;
    }

    const totalPages = Math.ceil(dataLength / ITEMS_PER_PAGE);

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage[tab] - 1 && i <= currentPage[tab] + 1)) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              isActive={currentPage[tab] === i}
              onClick={() => handlePageChange(tab, i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (
        (i === currentPage[tab] - 2 && i > 2) ||
        (i === currentPage[tab] + 2 && i < totalPages - 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };


  const createTask = async () => {
    try {
      const response = await axios.get(`https://api.gajkesaristeels.in/task/getByStoreAndDate?storeId=${storeId}&start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequirementsData(response.data.filter((task: any) => task.taskType === 'requirement'));
      setComplaintsData(response.data.filter((task: any) => task.taskType === 'complaint'));
    } catch (error) {
      console.error('Error fetching updated tasks:', error);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    return nameParts.map(part => part[0]).join('');
  };

  const handleBackClick = () => {
    router.push('/CustomerListPage');
  };

  const addNote = () => {
    setIsEditMode(false);
    setNoteContent('');
    setIsModalVisible(true);
  };

  const getOutcomeStatus = (visit: Visit) => {
    if (visit.visit_date) {
      return { emoji: '✅', status: 'Complete', color: 'bg-purple-100 text-purple-800' };
    } else {
      return { emoji: '📅', status: 'Assigned', color: 'bg-blue-100 text-blue-800' };
    }
  };

  const paginate = (data: any[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const handleChangeStatus = async (taskId: number, status: string) => {
    try {
      await axios.put(`https://api.gajkesaristeels.in/task/updateTask?taskId=${taskId}`, {
        status,
        priority: "Medium",
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      message.success('Status updated successfully!');
      createTask();
    } catch (error) {
      console.error('Error updating status:', error);
      message.error('Error updating status.');
    }
  };

  const statusMenu = (taskId: number) => (
    <Menu onClick={({ key }) => handleChangeStatus(taskId, key)}>
      <Menu.Item key="Assigned">Assigned</Menu.Item>
      <Menu.Item key="On Going">On Going</Menu.Item>
      <Menu.Item key="Complete">Complete</Menu.Item>
    </Menu>
  );

  const calculateIntentTrend = () => {
    const dates = intentData.map(item => item.changeDate);
    const intentLevels = intentData.map(item => item.newIntentLevel);
    return { dates, intentLevels };
  };

  const calculateSalesTrend = () => {
    const dates = salesData.map(item => item.visitDate);
    const salesAmounts = salesData.map(item => item.newMonthlySale);
    return { dates, salesAmounts };
  };

  const { dates: intentDates, intentLevels } = calculateIntentTrend();
  const { dates: salesDates, salesAmounts } = calculateSalesTrend();

  const intentChartData = {
    labels: intentDates,
    datasets: [
      {
        label: 'Intent Level',
        data: intentLevels,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const salesChartData = {
    labels: salesDates,
    datasets: [
      {
        label: 'Monthly Sales',
        data: salesAmounts,
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
      },
    ],
  };
  useEffect(() => {
    if (token && storeId) {
      fetchCustomerData(storeId as string);
      fetchNotesData(storeId as string);
      fetchVisitsData(storeId as string);
      fetchRequirementsData(storeId as string, startDate, endDate);
      fetchComplaintsData(storeId as string, startDate, endDate);
      fetchEmployees();
      fetchStores();
      fetchIntentData(storeId as string);
      fetchSalesData(storeId as string);
    }
  }, [token, storeId, startDate, endDate, fetchCustomerData, fetchNotesData, fetchVisitsData, fetchRequirementsData, fetchComplaintsData, fetchEmployees, fetchStores, fetchIntentData, fetchSalesData]);
  return (
    <div className="container main-content">
      <Head>
        <title>Customer Detail Page</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="afterInteractive" />

      <div className="contact-details">
        <aside className="left-panel">
          <div className="back-button" onClick={handleBackClick}><i className="fas fa-arrow-left"></i> Back to customers</div>
          <div className="profile">
            <div className="avatar">
              <span>{customerData ? getInitials(`${customerData.clientFirstName} ${customerData.clientLastName}`) : 'JB'}</span>
            </div>
            <h2>{customerData ? `${customerData.clientFirstName} ${customerData.clientLastName}` : 'Jerome Bell'}</h2>
            <p className="company">{customerData ? customerData.storeName : 'Google'}</p>
          </div>
          <div className="action-buttons">
            <Button className="action-button" onClick={() => setIsEditCustomerModalVisible(true)}>
              <i className="fas fa-edit"></i> Edit Customer
            </Button>
            <Button className="action-button" onClick={() => setIsComplaintModalOpen(true)}><i className="fas fa-envelope"></i> Log Complaint</Button>
            <Button className="action-button" onClick={() => setIsRequirementModalOpen(true)}><i className="fas fa-phone"></i> Add Requirement</Button>
          </div>
        
          <div className="info-tabs">
            <div
              className={`info-tab ${activeInfoTab === 'leads-info' ? 'active' : ''}`}
              onClick={() => setActiveInfoTab('leads-info')}
            >
              Leads info
            </div>
            <div
              className={`info-tab ${activeInfoTab === 'address-info' ? 'active' : ''}`}
              onClick={() => setActiveInfoTab('address-info')}
            >
              Address info
            </div>
          </div>
          <div className={`info-content ${activeInfoTab === 'leads-info' ? 'active' : ''}`}>
            {customerData && (
              <div className="info-content-inner">
                <p><i className="fas fa-user" style={{ color: 'purple' }}></i> <strong>Customer Name</strong><br />{customerData.clientFirstName} {customerData.clientLastName}</p>
                <p><i className="fas fa-envelope" style={{ color: 'purple' }}></i> <strong>Email</strong><br />{customerData.email || 'N/A'}</p>
                <p><i className="fas fa-phone" style={{ color: 'purple' }}></i> <strong>Phone</strong><br />{customerData.primaryContact}</p>
                <p><i className="fas fa-store" style={{ color: 'purple' }}></i> <strong>Store Name</strong><br />{customerData.storeName}</p>
                <p><i className="fas fa-user-tag" style={{ color: 'purple' }}></i> <strong>Client Type</strong><br />{customerData.clientType || 'N/A'}</p>
              </div>
            )}
          </div>
          <div className={`info-content ${activeInfoTab === 'address-info' ? 'active' : ''}`}>
            {customerData && (
              <div className="info-content-inner">
                <p><i className="fas fa-map-marker-alt" style={{ color: 'purple' }}></i> <strong>Address</strong><br />{customerData.addressLine1 || 'N/A'}, {customerData.addressLine2 || ''}, {customerData.city}, {customerData.state}, {customerData.country || 'N/A'}, {customerData.pincode || 'N/A'}</p>
                <p><i className="fas fa-city" style={{ color: 'purple' }}></i> <strong>City</strong><br />{customerData.city}</p>
                <p><i className="fas fa-flag" style={{ color: 'purple' }}></i> <strong>State</strong><br />{customerData.state}</p>
              </div>
            )}
          </div>
        </aside>
        <section className="activity-details">
          <div className="tabs">
            <button className={`tab ${activeActivityTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveActivityTab('visits')}>
              <i className="fas fa-calendar-check"></i> Visits
            </button>
            <button className={`tab ${activeActivityTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveActivityTab('notes')}>
              <i className="fas fa-sticky-note"></i> Notes
            </button>
            <button className={`tab ${activeActivityTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveActivityTab('complaints')}>
              <i className="fas fa-exclamation-circle"></i> Complaints
            </button>
            <button className={`tab ${activeActivityTab === 'requirements' ? 'active' : ''}`} onClick={() => setActiveActivityTab('requirements')}>
              <i className="fas fa-tasks"></i> Requirements
            </button>
            {showSitesTab && (
              <button className={`tab ${activeActivityTab === 'sites' ? 'active' : ''}`} onClick={() => setActiveActivityTab('sites')}>
                <i className="fas fa-map-marker-alt"></i> Sites
              </button>
            )}
          </div>
          {showSitesTab && token && (
            <div className={`tab-content ${activeActivityTab === 'sites' ? 'active' : ''}`}>
              <Sites storeId={getStoreId()} token={getToken()} />
            </div>
          )}

          <div className={`tab-content ${activeActivityTab === 'visits' ? 'active' : ''}`}>
            <div className="filter-bar">
              <Select placeholder="Status Filter" onChange={handleStatusChange} style={{ width: 200 }}>
                <Option value="All Statuses">All Statuses</Option>
                <Option value="Assigned">Assigned</Option>
                <Option value="On Going">On Going</Option>
                <Option value="Complete">Complete</Option>
              </Select>
            </div>
            {paginate(filteredVisitsData, currentPage.visits).map((visit, index) => {
              const { emoji, status, color } = getOutcomeStatus(visit);
              return (
                <div key={index} className="card task-item">
                  <div className="task-header">
                    <i className="fas fa-calendar-alt"></i>
                    <span>Visit scheduled by {visit.employeeName}</span>
                    <span className="due-date">Date: {new Date(visit.visit_date).toLocaleDateString()}</span>
                  </div>
           
                  <p className="visit-purpose">{visit.purpose}</p>
                  <div className="task-footer">
                    <div className="task-detail">
                      <span>Status</span>
                      <span className={`status-tag ${color}`}>{emoji} {status}</span>
                    </div>
                    <div className="task-detail">
                      <span>Purpose</span>
                      <span style={{ color: 'purple' }}>{visit.purpose}</span>
                    </div>
                    <div className="assigned-user">
                      <div className="avatar small">{getInitials(visit.employeeName)}</div>
                      <span>{visit.employeeName}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {showMore.visits && visitsData.length > ITEMS_PER_PAGE && (
              <Pagination>
                <PaginationPrevious
                  onClick={currentPage.visits === 1 ? undefined : () => setCurrentPage(prev => ({ ...prev, visits: Math.max(prev.visits - 1, 1) }))}
                />
                <PaginationContent>
                  {renderPaginationItems('visits')}
                </PaginationContent>
                <PaginationNext
                  onClick={currentPage.visits === Math.ceil(visitsData.length / ITEMS_PER_PAGE) ? undefined : () => setCurrentPage(prev => ({ ...prev, visits: Math.min(prev.visits + 1, Math.ceil(visitsData.length / ITEMS_PER_PAGE)) }))}
                />

              </Pagination>
            )}
            {visitsData.length > 3 && (
              <Button onClick={() => setShowMore(prev => ({ ...prev, visits: !prev.visits }))}>
                {showMore.visits ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
          <div className={`tab-content ${activeActivityTab === 'notes' ? 'active' : ''}`}>
            <div className="filter-bar">
              <Button className="add-note-btn" onClick={addNote}>
                <i className="fas fa-plus"></i> Add Note
              </Button>
            </div>
            {paginate(notesData, currentPage.notes).map((note) => (
              <div key={note.id} className="note-item">
                <div className="note-header">
                  <span className="note-date">{new Date(note.createdDate).toLocaleDateString()}</span>
                  <div className="note-actions">
                    <a href="#" onClick={() => handleEditNote(note)}>
                      Edit
                    </a>
                    <a href="#" className="note-delete" onClick={() => handleDeleteNote(note.id)}>
                      Delete
                    </a>
                  </div>
                </div>
                <div className="note-content">{note.content}</div>
              </div>
            ))}
            {showMore.notes && notesData.length > ITEMS_PER_PAGE && (
              <Pagination>
                <PaginationPrevious
                  onClick={currentPage.notes === 1 ? undefined : () => setCurrentPage(prev => ({ ...prev, notes: Math.max(prev.notes - 1, 1) }))}
                />
                <PaginationContent>
                  {renderPaginationItems('notes')}
                </PaginationContent>
                <PaginationNext
                  onClick={currentPage.notes === Math.ceil(notesData.length / ITEMS_PER_PAGE) ? undefined : () => setCurrentPage(prev => ({ ...prev, notes: Math.min(prev.notes + 1, Math.ceil(notesData.length / ITEMS_PER_PAGE)) }))}
                />

              </Pagination>
            )}
            {notesData.length > 3 && (
              <Button onClick={() => setShowMore(prev => ({ ...prev, notes: !prev.notes }))}>
                {showMore.notes ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
          <div className={`tab-content ${activeActivityTab === 'complaints' ? 'active' : ''}`}>
            <div className="filter-bar" style={{ display: 'flex', gap: '10px' }}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button style={{ borderColor: 'black', borderWidth: '1px' }} className={`border w-[280px] justify-start text-left font-normal ${!startDate && 'text-muted-foreground'}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(new Date(startDate), 'PPP') : <span>Start Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date || new Date());
                      setEndDate(addDays(date || new Date(), 5));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button style={{ borderColor: 'black', borderWidth: '1px' }} className={`border w-[280px] justify-start text-left font-normal ${!endDate && 'text-muted-foreground'}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(new Date(endDate), 'PPP') : <span>End Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setEndDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

            </div>
            {paginate(complaintsData, currentPage.complaints).map((complaint) => (
              <div key={complaint.id} className="card task-item">
                <div className="task-header">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{complaint.taskTitle}</span>
                  <span className="due-date">Due: {new Date(complaint.dueDate).toLocaleDateString()}</span>
                </div>
                <p className="task-desc">{complaint.taskDescription}</p>
                <div className="task-footer">
                  <div className="task-detail">
                    <span>Status</span>
                    <Dropdown overlay={statusMenu(complaint.id)}>
                      <Button className={`status-button ${complaint.status.replace(/ /g, '-').toLowerCase()}`}>{complaint.status || 'Assigned'}</Button>
                    </Dropdown>
                  </div>
                  <div className="task-detail">
                    <span>Priority</span>
                    <span style={{ color: 'purple' }}>{complaint.priority}</span>
                  </div>
                  <div className="assigned-user">
                    <div className="avatar small">{getInitials(complaint.assignedToName)}</div>
                    <span>{complaint.assignedToName}</span>
                  </div>
                </div>
              </div>
            ))}
            {showMore.complaints && complaintsData.length > ITEMS_PER_PAGE && (
            <Pagination>
                <PaginationPrevious
                  onClick={currentPage.complaints === 1 ? undefined : () => setCurrentPage(prev => ({ ...prev, complaints: Math.max(prev.complaints - 1, 1) }))}
                />
                <PaginationContent>
                  {renderPaginationItems('complaints')}
                </PaginationContent>
                <PaginationNext
                  onClick={currentPage.complaints === Math.ceil(complaintsData.length / ITEMS_PER_PAGE) ? undefined : () => setCurrentPage(prev => ({ ...prev, complaints: Math.min(prev.complaints + 1, Math.ceil(complaintsData.length / ITEMS_PER_PAGE)) }))}
                />

            </Pagination>
            )}
            {complaintsData.length > 3 && (
              <Button onClick={() => setShowMore(prev => ({ ...prev, complaints: !prev.complaints }))}>
                {showMore.complaints ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
          <div className={`tab-content ${activeActivityTab === 'requirements' ? 'active' : ''}`}>
            <div className="filter-bar" style={{ display: 'flex', gap: '10px' }}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button style={{ borderColor: 'black', borderWidth: '1px', borderStyle: 'solid' }} className={`w-[280px] justify-start text-left font-normal ${!startDate && 'text-muted-foreground'}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(new Date(startDate), 'PPP') : <span>Start Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date || new Date());
                      setEndDate(addDays(date || new Date(), 5));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button style={{ borderColor: 'black', borderWidth: '1px', borderStyle: 'solid' }} className={`w-[280px] justify-start text-left font-normal ${!endDate && 'text-muted-foreground'}`}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(new Date(endDate), 'PPP') : <span>End Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setEndDate(date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

            </div>
            {paginate(requirementsData, currentPage.requirements).map((requirement) => (
              <div key={requirement.id} className="card task-item">
                <div className="task-header">
                  <i className="fas fa-tasks"></i>
                  <span>{requirement.taskTitle}</span>
                  <span className="due-date">Due: {new Date(requirement.dueDate).toLocaleDateString()}</span>
                </div>
                <p className="task-desc">{requirement.taskDescription}</p>
                <div className="task-footer">
                  <div className="task-detail">
                    <span>Status</span>
                    <Dropdown overlay={statusMenu(requirement.id)}>
                      <Button className={`status-button ${requirement.status.replace(/ /g, '-').toLowerCase()}`}>{requirement.status || 'Assigned'}</Button>
                    </Dropdown>
                  </div>
                  <div className="task-detail">
                    <span>Priority</span>
                    <span style={{ color: 'purple' }}>{requirement.priority}</span>
                  </div>
                  <div className="assigned-user">
                    <div className="avatar small">{getInitials(requirement.assignedToName)}</div>
                    <span>{requirement.assignedToName}</span>
                  </div>
                </div>
              </div>
            ))}
            {showMore.requirements && requirementsData.length > ITEMS_PER_PAGE && (
            <Pagination>
                <PaginationPrevious
                  onClick={currentPage.requirements === 1 ? undefined : () => setCurrentPage(prev => ({ ...prev, requirements: Math.max(prev.requirements - 1, 1) }))}
                />
                <PaginationContent>
                  {renderPaginationItems('requirements')}
                </PaginationContent>
                <PaginationNext
                  onClick={currentPage.requirements === Math.ceil(requirementsData.length / ITEMS_PER_PAGE) ? undefined : () => setCurrentPage(prev => ({ ...prev, requirements: Math.min(prev.requirements + 1, Math.ceil(requirementsData.length / ITEMS_PER_PAGE)) }))}
                />

            </Pagination>
            )}
            {requirementsData.length > 3 && (
              <Button onClick={() => setShowMore(prev => ({ ...prev, requirements: !prev.requirements }))}>
                {showMore.requirements ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
        </section>
        <aside className="charts">
      
        </aside>
      </div>

      <Modal
        title={isEditMode ? 'Edit Note' : 'Add Note'}
        visible={isModalVisible}
        onOk={isEditMode ? handleSaveEditNote : handleAddNote}
        onCancel={() => setIsModalVisible(false)}
        okText={isEditMode ? 'Update' : 'Add'}
      >
        <TextArea
          placeholder="Enter note content"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={4}
        />
      </Modal>

      <Modal
        title="Create Visit"
        visible={isVisitModalVisible}
        onCancel={() => setIsVisitModalVisible(false)}
        footer={null}
      >
        <Form form={visitForm} onFinish={handleVisitFormSubmit} layout="vertical">
          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: 'Please enter the purpose of the visit' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="visit_date"
            label="Visit Date"
            rules={[{ required: true, message: 'Please select the visit date' }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="employeeId"
            label="Assigned Employee"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select placeholder="Select an employee">
              {employees.map(employee => (
                <Option key={employee.id} value={employee.id}>
                  {employee.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create Visit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <CreateRequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        employees={employees}
        stores={stores}
        storeId={parseInt(storeId as string)}
        createTask={createTask}
      />
      <EditCustomerModal
        isOpen={isEditCustomerModalVisible}
        onClose={() => setIsEditCustomerModalVisible(false)}
        customerData={customerData}
        onSubmit={handleCustomerEditSubmit}
      />
      <CreateComplaintModal
        isOpen={isComplaintModalOpen}
        onClose={() => setIsComplaintModalOpen(false)}
        employees={employees}
        stores={stores}
        storeId={parseInt(storeId as string)}
        createTask={createTask}
      />
    </div>
  );
};

export default CustomerDetailPage;
