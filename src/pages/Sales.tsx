import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux'; // Import useSelector
import { RootState } from '../store'; // Import RootState
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from "@/components/ui/table"; // Import Table components
import { CalendarIcon, Loader, AlertTriangle, PlusCircle, User, Archive } from 'lucide-react'; // Added User, Archive
import { format, subDays } from 'date-fns'; // Added subDays
import { sortBy } from 'lodash'; // Import sortBy
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // Import Pagination
import './Sales.css'; // Import the new CSS file

// Define interfaces for fetched data
interface Store {
    id: number;
    storeName: string;
}

interface Employee {
    id: number;
    firstName: string;
    lastName: string;
}

interface StoreDetails extends Store {
    employeeId: number;
    city?: string;
    state?: string;
    // Add other fields from the response if needed
}

// Removed placeholder data

interface SaleData {
  storeId: string;
  fieldOfficerId: string;
  tons: number | string; // Use string initially for input compatibility
  date: Date | undefined;
}

// Interface for the sales records displayed in the table
// Adjust based on the actual API response for fetching sales
interface SalesRecord {
  id: number; // Assuming sales have an ID
  storeName: string;
  employeeName: string;
  city: string;
  state: string;
  tons: number;
  date: string; // Add date field (assuming API returns string)
}

// Interface for the sales summary data - now includes city/state
interface SummaryData {
  employeeId: number;
  employeeName: string;
  totalTons: number;
  storeId: number;
  storeName: string;
  storeCity?: string; // Add city
  storeState?: string; // Add state
}

const Sales: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]); // State for stores
  const [fieldOfficers, setFieldOfficers] = useState<Employee[]>([]); // State for field officers
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const [isLoadingAssignedOfficer, setIsLoadingAssignedOfficer] = useState(false); // New loading state
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreatingSale, setIsCreatingSale] = useState(false); // Loading state for create button
  const [isLoadingSales, setIsLoadingSales] = useState(false); // Loading state for the table
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]); // State for table data
  const [activeTab, setActiveTab] = useState("records"); // State for active tab

  // State for Records Tab Search Filters - Consolidated
  const [recordsFilters, setRecordsFilters] = useState({
      storeName: '',
      employeeName: '',
      city: '',
      state: '',
  });

  // State for Records Tab Pagination
  const [recordsCurrentPage, setRecordsCurrentPage] = useState(1); // Current page (1-indexed UI)
  const [recordsTotalPages, setRecordsTotalPages] = useState(0); // Total pages from API
  const [recordsTotalElements, setRecordsTotalElements] = useState(0); // Total elements from API
  const recordsItemsPerPage = 15; // Keep this for page size request

  // State for Summary Tab
  const [summaryStartDate, setSummaryStartDate] = useState<Date | undefined>(subDays(new Date(), 7));
  const [summaryEndDate, setSummaryEndDate] = useState<Date | undefined>(new Date());
  const [summaryData, setSummaryData] = useState<SummaryData[] | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [newSaleData, setNewSaleData] = useState<SaleData>({
    storeId: '',
    fieldOfficerId: '',
    tons: '',
    date: undefined,
  });

  const token = useSelector((state: RootState) => state.auth.token); // Get token from Redux
  // const loggedInUserId = useSelector((state: RootState) => state.auth.user?.id); // No longer needed for officeManagerId

  const fetchStores = useCallback(async () => {
    if (!token) return;
    setIsLoadingStores(true);
    setFetchError(null);
    try {
      const response = await fetch('https://api.gajkesaristeels.in/store/names', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Store[] = await response.json();
      setStores(sortBy(data, 'storeName')); // Sort stores by name
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      setFetchError('Failed to load stores. Please try again.');
    } finally {
      setIsLoadingStores(false);
    }
  }, [token]);

  const fetchFieldOfficers = useCallback(async () => {
    if (!token) return;
    setIsLoadingOfficers(true);
    setFetchError(null); // Reset error before new fetch
    try {
      // Assuming field officers are fetched from the general employee endpoint
      const response = await fetch('https://api.gajkesaristeels.in/employee/getAll', {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      });
      if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Employee[] = await response.json();
       // Assuming Field Officers have a specific role or need filtering?
       // For now, using all employees. Adjust if needed.
      setFieldOfficers(sortBy(data, (emp) => `${emp.firstName} ${emp.lastName}`));
    } catch (error: any) {
      console.error('Error fetching field officers:', error);
      setFetchError('Failed to load field officers. Please try again.');
    } finally {
      setIsLoadingOfficers(false);
    }
  }, [token]);

  // Fetch assigned officer for a specific store
  const fetchAssignedOfficer = async (storeId: string) => {
    if (!token || !storeId) return;
    setIsLoadingAssignedOfficer(true);
    setFetchError(null); // Clear previous errors
    try {
      const response = await fetch(`https://api.gajkesaristeels.in/store/getById?id=${storeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: StoreDetails = await response.json();
      if (data.employeeId) {
        // Set the field officer ID automatically
        setNewSaleData(prev => ({ ...prev, fieldOfficerId: data.employeeId.toString() }));
      } else {
         console.warn(`Store ID ${storeId} does not have an assigned employeeId.`);
         setNewSaleData(prev => ({ ...prev, fieldOfficerId: '' })); // Clear if no officer assigned
         setFetchError(`Store ${data.storeName} has no assigned officer.`);
      }
    } catch (error: any) {
      console.error(`Error fetching assigned officer for store ${storeId}:`, error);
      setFetchError('Could not load assigned officer.');
      setNewSaleData(prev => ({ ...prev, fieldOfficerId: '' })); // Clear on error
    } finally {
      setIsLoadingAssignedOfficer(false);
    }
  };

  // Fetch Sales Records for the Table (Now Paginated)
  const fetchSalesRecords = useCallback(async (page: number) => { // page is 0-indexed
    if (!token) return;
    setIsLoadingSales(true);
    setFetchError(null);

    // Construct query parameters using recordsFilters state
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', recordsItemsPerPage.toString());

    // Define mapping from frontend filter keys to backend param names
    const filterParamMapping: { [key: string]: string } = {
        storeName: 'storeName',
        employeeName: 'employeeName',
        city: 'city',
        state: 'state'
    };

    // Iterate over filters and append if value exists
    Object.entries(recordsFilters).forEach(([key, value]) => {
        if (value && filterParamMapping[key]) {
            params.append(filterParamMapping[key], value);
        }
    });

    const url = `https://api.gajkesaristeels.in/sales/getFilteredSales?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
         // Attempt to parse error message
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || `Failed to load page ${page + 1}.`;
        } catch (e) { /* Ignore if response is not JSON */}
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Map the API response fields from the 'content' array
      const mappedData: SalesRecord[] = data.content.map((item: any) => ({
        id: item.id,
        storeName: item.storeName,
        employeeName: item.employeeName,
        city: item.storeCity,
        state: item.storeState,
        tons: item.tons,
        date: item.createdAt, // Use createdAt field from API response
      }));

      setSalesRecords(mappedData); // Set only the current page's data
      setRecordsCurrentPage(data.number + 1); // Update current page (API is 0-indexed)
      setRecordsTotalPages(data.totalPages);
      setRecordsTotalElements(data.totalElements);

    } catch (error: any) { // Catch block needs type assertion or check
      console.error('Error fetching sales records:', error);
      // Use type assertion or check
      const errorMessage = (error instanceof Error) ? error.message : 'Failed to load sales records. Please refresh the page.';
      setFetchError(errorMessage);
      setSalesRecords([]); // Clear data on error
      setRecordsTotalPages(0);
      setRecordsTotalElements(0);
    } finally {
      setIsLoadingSales(false);
    }
  }, [
      token,
      recordsItemsPerPage,
      recordsFilters, // Depend on the entire filters object
  ]);

  // Fetch data when the modal is opened
  useEffect(() => {
    if (isModalOpen) {
      fetchStores();
      fetchFieldOfficers();
      // Reset form data when opening modal
      setNewSaleData({ storeId: '', fieldOfficerId: '', tons: '', date: undefined });
      setFetchError(null);
      setCreateError(null);
    }
  }, [isModalOpen, fetchStores, fetchFieldOfficers]);

  // Debounced fetch for sales records when page or filters change
  useEffect(() => {
    // Set up a timer to fetch data after a delay
    const handler = setTimeout(() => {
      // Fetch using the current page (adjusted for 0-indexing)
      // fetchSalesRecords uses the latest recordsFilters state internally
      fetchSalesRecords(recordsCurrentPage - 1);
    }, 500); // 500ms debounce delay

    // Cleanup function to clear the timeout if dependencies change before delay finishes
    return () => {
      clearTimeout(handler);
    };
  }, [
      recordsFilters,     // Re-run effect when filters change
      recordsCurrentPage, // Re-run effect when page changes
      fetchSalesRecords,  // Include fetch function for its dependencies (like token)
  ]);

   // Fetch stores only on mount
   useEffect(() => {
     fetchStores();
   }, [fetchStores]);

  const handleInputChange = (field: keyof SaleData, value: any) => {
    setNewSaleData(prev => ({ ...prev, [field]: value }));

    // If store is changed, fetch its assigned officer
    if (field === 'storeId') {
       setNewSaleData(prev => ({ ...prev, fieldOfficerId: '' })); // Clear previous officer selection
       fetchAssignedOfficer(value); // value here is the new storeId
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
     setNewSaleData(prev => ({ ...prev, date: date }));
  };

  // Handle Create Sale Button Click
  const handleCreateSale = async () => {
    const payload = {
        employeeId: parseInt(newSaleData.fieldOfficerId, 10),
        storeId: parseInt(newSaleData.storeId, 10),
        officeManagerId: 86, // Set static ID 86
        tons: parseFloat(newSaleData.tons.toString()),
    };

    // Basic validation (keep employeeId, storeId, tons check)
    if (isNaN(payload.employeeId) || isNaN(payload.storeId) || isNaN(payload.tons)) {
        setCreateError("Please ensure Store, Field Officer, and Tons are filled correctly.");
        return;
    }

    setIsCreatingSale(true);
    setCreateError(null);

    try {
        const response = await fetch('https://api.gajkesaristeels.in/sales/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });

        const responseBody = await response.text();

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
              const errorData = JSON.parse(responseBody);
              errorMessage = errorData.message || errorMessage;
            } catch (e) { /* Ignore parsing error */ }
            throw new Error(errorMessage);
        }

        console.log("Sale created successfully:", responseBody);
        fetchSalesRecords(0); // Re-fetch sales records after creation
        setNewSaleData({ storeId: '', fieldOfficerId: '', tons: '', date: undefined }); // Reset form
        setIsModalOpen(false); // Close modal

    } catch (error: any) {
        console.error("Error creating sale:", error);
        setCreateError(error.message || "Failed to create sale. Please try again.");
    } finally {
        setIsCreatingSale(false);
    }
  };

  // Fetch Sales Summary Data - No longer takes storeId
  const fetchSalesSummary = async (startDate: Date, endDate: Date) => {
    if (!token || !startDate || !endDate) return;
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);

    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    // Construct query parameters for the endpoint (without storeId)
    const params = new URLSearchParams();
    params.append('startDate', formattedStartDate);
    params.append('endDate', formattedEndDate);
    // params.append('storeId', storeId); // Removed storeId
    params.append('page', '0'); // Request first page (adjust if API supports fetching all pages)
    params.append('size', '100'); // Request a larger size (adjust as needed or implement pagination)

    const url = `https://api.gajkesaristeels.in/sales/totalTons?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
           const errorData = await response.json();
           errorMsg = errorData.message || errorMsg;
        } catch (e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();

      // Check if content exists
      if (data.content) {
          // The response content is already an array of SummaryData objects (based on API structure)
          setSummaryData(data.content);
      } else {
          setSummaryData([]); // Set empty array if no content
      }

    } catch (error: any) {
      console.error('Error fetching sales summary:', error);
      setSummaryError(error.message || 'Failed to load sales summary.');
      setSummaryData(null); // Ensure summary data is cleared on error
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Handler for summary date changes (can add validation later)
  const handleSummaryDateChange = (date: Date | undefined, type: 'start' | 'end') => {
    if (type === 'start') {
      setSummaryStartDate(date);
    } else {
      setSummaryEndDate(date);
    }
    // Optional: Add date range validation here if needed
  };

  // Handler for applying summary filters
  const handleApplySummaryFilters = () => {
    if (summaryStartDate && summaryEndDate) {
      // Pass only dates to fetchSalesSummary
      fetchSalesSummary(summaryStartDate, summaryEndDate);
    } else {
      setSummaryError("Please select a start date and end date.");
      setSummaryData(null); // Clear previous data if filters are invalid
    }
  };

  // Handler for clearing summary filters
  const handleClearSummaryFilters = () => {
    // setSummaryStoreId(''); // Removed
    setSummaryStartDate(subDays(new Date(), 7)); // Reset to default date range
    setSummaryEndDate(new Date());
    setSummaryData(null); // Clear the summary data
    setSummaryError(null); // Clear any summary errors
  };

  // Handler for records page change - just update the state
  const handleRecordsPageChange = (page: number) => {
    if (page !== recordsCurrentPage) {
        setRecordsCurrentPage(page);
    }
  };

  // Function to render pagination controls (can be reused or adapted)
  const renderRecordsPagination = () => {
    const pageNumbers = [];
    const displayPages = 5; // Max number of page links to show

    let startPage = Math.max(recordsCurrentPage - Math.floor(displayPages / 2), 1);
    let endPage = startPage + displayPages - 1;

    if (endPage > recordsTotalPages) {
        endPage = recordsTotalPages;
        startPage = Math.max(endPage - displayPages + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <Pagination>
            <PaginationContent>
                {recordsCurrentPage !== 1 && (
                    <PaginationPrevious
                        onClick={() => handleRecordsPageChange(recordsCurrentPage - 1)}
                        //href="#" // Prevent page jump if using as anchor
                    />
                )}
                {startPage > 1 && (
                    <>
                        <PaginationItem>
                            <PaginationLink onClick={() => handleRecordsPageChange(1)}>1</PaginationLink>
                        </PaginationItem>
                        {startPage > 2 && (
                            <PaginationItem>
                                <PaginationLink>...</PaginationLink> {/* Or use PaginationEllipsis */}
                            </PaginationItem>
                        )}
                    </>
                )}
                {pageNumbers.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink
                            isActive={page === recordsCurrentPage}
                            onClick={() => handleRecordsPageChange(page)}
                            //href="#" // Prevent page jump if using as anchor
                        >
                            {page}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                {endPage < recordsTotalPages && (
                    <>
                        {endPage < recordsTotalPages - 1 && (
                            <PaginationItem>
                                 <PaginationLink>...</PaginationLink> {/* Or use PaginationEllipsis */}
                            </PaginationItem>
                        )}
                        <PaginationItem>
                            <PaginationLink onClick={() => handleRecordsPageChange(recordsTotalPages)}>{recordsTotalPages}</PaginationLink>
                        </PaginationItem>
                    </>
                )}
                {recordsCurrentPage !== recordsTotalPages && (
                    <PaginationNext
                        onClick={() => handleRecordsPageChange(recordsCurrentPage + 1)}
                        //href="#" // Prevent page jump if using as anchor
                    />
                )}
            </PaginationContent>
        </Pagination>
    );
  };

  return (
    <div className="container-sales py-8 px-4 sm:px-6 lg:px-8">
      <Card className="w-full mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Sales Management</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
              <Button onClick={() => setIsModalOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Sale
              </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Add New Sale</DialogTitle>
              <DialogDescription>
                  Enter the details for the new sale record.
              </DialogDescription>
            </DialogHeader>
              <div className="grid gap-4 py-4">
                  {/* Store Selection */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="storeIdModal" className="text-right">Store</Label>
                    <Select
                      value={newSaleData.storeId}
                      onValueChange={(value) => handleInputChange('storeId', value)}
                    >
                          <SelectTrigger id="storeIdModal" className="col-span-3">
                              <SelectValue placeholder={isLoadingStores ? "Loading stores..." : "Select a store"} />
                      </SelectTrigger>
                      <SelectContent>
                              {!isLoadingStores && stores.map((store) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.storeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                  {/* Field Officer Selection */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="fieldOfficerIdModal" className="text-right">Field Officer</Label>
                    <Select
                      value={newSaleData.fieldOfficerId}
                      onValueChange={(value) => handleInputChange('fieldOfficerId', value)}
                          disabled={isLoadingAssignedOfficer} // Disable while loading assigned officer
                    >
                           <SelectTrigger id="fieldOfficerIdModal" className="col-span-3">
                              <SelectValue placeholder={isLoadingOfficers || isLoadingAssignedOfficer ? "Loading..." : "Select officer"} />
                      </SelectTrigger>
                      <SelectContent>
                              {!isLoadingOfficers && fieldOfficers.map((officer) => (
                          <SelectItem key={officer.id} value={officer.id.toString()}>
                                      {`${officer.firstName} ${officer.lastName}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                  {/* Tons Input */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tonsModal" className="text-right">Tons</Label>
                    <Input
                          id="tonsModal"
                          type="number" // Use number type for better input control
                          placeholder="Enter tons"
                      value={newSaleData.tons}
                      onChange={(e) => handleInputChange('tons', e.target.value)}
                          className="col-span-3"
                    />
                  </div>

                 {/* Date Picker - Re-enabled */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="dateModal" className="text-right">Date</Label>
                   <Popover>
                      <PopoverTrigger asChild>
                        <Button
                           id="dateModal"
                           variant={"outline"}
                                  className={`col-span-3 justify-start text-left font-normal ${
                                      !newSaleData.date && "text-muted-foreground"
                                  }`}
                         >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newSaleData.date ? format(newSaleData.date, "PPP") : <span>Pick a date</span>}
                         </Button>
                      </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newSaleData.date}
                                  onSelect={handleDateSelect} // Use the existing handler
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                 </div>
              {/* Fetch Error Display */}
              {fetchError && (
                  <p className="text-sm text-red-600 mt-2 px-1">{fetchError}</p>
              )}
              {/* Create Error Display */}
              {createError && (
                  <p className="text-sm text-red-600 mt-2 px-1">{createError}</p>
              )}
            <DialogFooter>
              <Button
                    type="button" // Change to button if not submitting a form element
                onClick={handleCreateSale}
                    disabled={
                        isCreatingSale || isLoadingAssignedOfficer || // Disable if creating or loading officer
                        !newSaleData.storeId ||
                        !newSaleData.fieldOfficerId ||
                        !newSaleData.tons ||
                        isNaN(parseFloat(newSaleData.tons.toString())) || // Validate tons is a number
                        !newSaleData.date // Re-add date validation
                    }
               >
                   {isCreatingSale ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                   {isCreatingSale ? 'Adding...' : 'Add Sale'}
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </CardHeader>
      </Card>

      {/* Tabs Component moved outside the Card */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="records">Sales Records</TabsTrigger>
              <TabsTrigger value="summary">Sales Summary</TabsTrigger>
          </TabsList>
          <TabsContent value="records">
              {/* Sales Records Table */}
              <div className="mt-4">
                  {/* Wrap conditional rendering and pagination in a Fragment */}
                  <>
                      {isLoadingSales ? (
                          <div className="flex justify-center items-center h-64">
                              <Loader className="w-8 h-8 animate-spin text-primary" />
                          </div>
                      ) : fetchError && salesRecords.length === 0 ? (
                          <div className="text-center py-10">
                              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                              <p className="text-lg font-semibold text-red-700">{fetchError}</p>
                              <p className="text-gray-500 mt-2">Could not load sales data. Please try refreshing.</p>
                          </div>
                      ) : salesRecords.length === 0 ? (
                          <div className="text-center py-10">
                              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                              <p className="text-lg font-semibold">No Sales Records Found</p>
                              <p className="text-gray-500 mt-2">There are currently no sales records to display.</p>
                          </div>
                      ) : (
                          <div className="w-full overflow-x-auto">
                              <Table>
                                  <TableCaption>A list of recent sales.</TableCaption>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Store Name</TableHead>
                                          <TableHead>Field Officer</TableHead>
                                          <TableHead>City</TableHead>
                                          <TableHead>State</TableHead>
                                          <TableHead className="pr-4">Date</TableHead>
                                          <TableHead className="text-right">Tons</TableHead>
                                      </TableRow>
                                       {/* Search Filter Row */}
                                      <TableRow>
                                          <TableCell className="p-1">
                                              <Input
                                                  placeholder="Search Store..."
                                                  value={recordsFilters.storeName}
                                                  onChange={(e) => {
                                                      setRecordsFilters(prev => ({ ...prev, storeName: e.target.value }));
                                                      setRecordsCurrentPage(1);
                                                  }}
                                                  className="h-8"
                                              />
                                          </TableCell>
                                          <TableCell className="p-1">
                                              <Input
                                                  placeholder="Search Officer..."
                                                  value={recordsFilters.employeeName}
                                                  onChange={(e) => {
                                                      setRecordsFilters(prev => ({ ...prev, employeeName: e.target.value }));
                                                      setRecordsCurrentPage(1);
                                                  }}
                                                  className="h-8"
                                              />
                                          </TableCell>
                                          <TableCell className="p-1">
                                              <Input
                                                  placeholder="Search City..."
                                                  value={recordsFilters.city}
                                                  onChange={(e) => {
                                                      setRecordsFilters(prev => ({ ...prev, city: e.target.value }));
                                                      setRecordsCurrentPage(1);
                                                  }}
                                                  className="h-8"
                                              />
                                          </TableCell>
                                          <TableCell className="p-1">
                                              <Input
                                                  placeholder="Search State..."
                                                  value={recordsFilters.state}
                                                  onChange={(e) => {
                                                      setRecordsFilters(prev => ({ ...prev, state: e.target.value }));
                                                      setRecordsCurrentPage(1);
                                                  }}
                                                  className="h-8"
                                              />
                                          </TableCell>
                                          <TableCell className="p-1 pr-4"></TableCell>
                                          <TableCell className="p-1 text-right"></TableCell>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {salesRecords.length > 0 ? (
                                          salesRecords.map((sale) => (
                                          <TableRow key={sale.id}>
                                              <TableCell className="font-medium">{sale.storeName}</TableCell>
                                              <TableCell>{sale.employeeName}</TableCell>
                                              <TableCell>{sale.city || 'N/A'}</TableCell>
                                              <TableCell>{sale.state || 'N/A'}</TableCell>
                                                  <TableCell className="pr-4">{sale.date ? format(new Date(sale.date), "dd MMM ''yy") : 'N/A'}</TableCell>
                                              <TableCell className="text-right">{sale.tons.toFixed(2)}</TableCell>
                                          </TableRow>
                                          ))
                                      ) : (
                                          <TableRow>
                                                <TableCell colSpan={6} className="h-24 text-center"> {/* Adjusted colSpan */}
                                                    No matching records found.
                                                </TableCell>
                                            </TableRow>
                                      )}
                                  </TableBody>
                              </Table>
                          </div>
                      )}
                      {/* Pagination Controls - Show based on total pages from API */}
                      {(recordsTotalPages > 1) && (
                         <div className="mt-8 flex justify-center">
                             {renderRecordsPagination()}
                         </div>
                      )}
                  </>
              </div>
          </TabsContent>
          <TabsContent value="summary">
              {/* Filters for Sales Summary */}
              <div className="mt-4 p-4 border rounded-md mb-6 bg-gradient-to-b from-[var(--gajkesari-black)] to-[var(--gajkesari-gray)]">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Store Filter - Removed */}
                    {/*
                    <div className="space-y-1">
                       <Label htmlFor="summaryStoreId" className="text-gray-200">Store</Label>
                       <Select value={summaryStoreId} onValueChange={setSummaryStoreId}>
                           <SelectTrigger id="summaryStoreId">
                               <SelectValue placeholder={isLoadingStores ? "Loading..." : "Select Store"} />
                           </SelectTrigger>
                           <SelectContent>
                               {!isLoadingStores && stores.map((store) => (
                                   <SelectItem key={store.id} value={store.id.toString()}>
                                       {store.storeName}
                                   </SelectItem>
                               ))}
                           </SelectContent>
                       </Select>
                    </div>
                    */}
                    {/* Start Date Filter */}
                    <div className="space-y-1 md:col-start-1"> {/* Adjust grid positioning */}
                        <Label htmlFor="summaryStartDate" className="text-gray-200">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="summaryStartDate"
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${
                                        !summaryStartDate && "text-muted-foreground"
                                    }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {summaryStartDate ? format(summaryStartDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={summaryStartDate}
                                    onSelect={(date) => handleSummaryDateChange(date, 'start')}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* End Date Filter */}
                    <div className="space-y-1">
                        <Label htmlFor="summaryEndDate" className="text-gray-200">End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="summaryEndDate"
                                    variant={"outline"}
                                    className={`w-full justify-start text-left font-normal ${
                                        !summaryEndDate && "text-muted-foreground"
                                    }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {summaryEndDate ? format(summaryEndDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={summaryEndDate}
                                    onSelect={(date) => handleSummaryDateChange(date, 'end')}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                     {/* Apply/Clear Buttons */} 
                    <div className="flex flex-col sm:flex-row gap-2 md:col-span-1">
                       <Button
                           onClick={handleApplySummaryFilters}
                           disabled={isSummaryLoading || !summaryStartDate || !summaryEndDate} // Removed storeId check
                           className="w-full"
                       >
                           {isSummaryLoading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                           Apply
                       </Button>
                       <Button
                           variant="outline"
                           onClick={handleClearSummaryFilters}
                           className="w-full bg-gray-600 text-white hover:bg-gray-700" /* Adjusted clear button style */ 
                       >
                           Clear
                       </Button>
                    </div>
                 </div>
              </div>

             {/* Display Area for Sales Summary */}
              <div className="mt-6">
                 {isSummaryLoading ? (
                     <div className="flex justify-center items-center h-40">
                         <Loader className="w-8 h-8 animate-spin text-primary" />
                     </div>
                 ) : summaryError ? (
                     <div className="text-center py-10 text-red-600">
                         <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                         <p className="text-lg font-semibold">Error Loading Summary</p>
                         <p>{summaryError}</p>
                     </div>
                 ) : summaryData && summaryData.length > 0 ? ( // Check if array has data
                     // Display the summary data in a table
                        <div className="w-full overflow-x-auto">
                            <Table>
                             <TableCaption>Sales summary for the selected period.</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Store Name</TableHead>
                                        <TableHead>City</TableHead>
                                        <TableHead>State</TableHead>
                                     <TableHead>Last Sale By</TableHead>
                                     {/* Date Range is implicit from filters, removed from table */}
                                     {/* <TableHead>Date Range</TableHead> */}
                                     <TableHead className="text-right">Total Tons</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {/* Map over the summaryData array */} 
                                {summaryData.map((summaryItem) => (
                                    <TableRow key={summaryItem.storeId}> {/* Use storeId as key */} 
                                        <TableCell className="font-medium">{summaryItem.storeName}</TableCell>
                                        <TableCell>{summaryItem.storeCity || 'N/A'}</TableCell>
                                        <TableCell>{summaryItem.storeState || 'N/A'}</TableCell>
                                        <TableCell>{summaryItem.employeeName || 'N/A'}</TableCell>
                                        {/* 
                                        <TableCell>
                                         {summaryStartDate ? format(summaryStartDate, "dd MMM ''yy") : ''}
                                         {' - '}
                                         {summaryEndDate ? format(summaryEndDate, "dd MMM ''yy") : ''}
                                        </TableCell>
                                        */}
                                        <TableCell className="text-right">{summaryItem.totalTons.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                 ) : (
                    // Show message to apply filters or if no data returned
                    <div className="text-center py-10 text-gray-500">
                         <p className="text-lg font-semibold">
                            {summaryData === null ? "Apply Filters for Summary" : "No Summary Data Found"}
                         </p>
                         <p className="mt-2">
                            {summaryData === null ? "Select a date range to view the sales summary." : "No sales summary data available for the selected date range."}
                         </p>
                    </div>
          )}
      </div>
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default Sales; 