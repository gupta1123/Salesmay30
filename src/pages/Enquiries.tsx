import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import './EnquiriesPage.css';
import { useQuery, QueryClient, QueryClientProvider, QueryKey, QueryFunctionContext } from 'react-query';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const queryClient = new QueryClient();

interface SalesData {
  [monthYear: string]: number;
}

interface Enquiry {
  id: number;
  taluka: string;
  population: number;
  dealerName: string;
  expenses: number;
  contactNumber: string;
  fileName: string;
  sheetName: string;
  sales: SalesData;
}

const formatDateToMMMyy = (date: Date | undefined): string => {
  return date ? format(date, 'MMM-yy') : '';
};

const EnquiriesPageContent: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [storeNameFilter, setStoreNameFilter] = useState<string>('');
  const [talukaFilter, setTalukaFilter] = useState<string>('');
  const [sheetNameFilter, setSheetNameFilter] = useState<string>('');
  const [fileNameFilter, setFileNameFilter] = useState<string>('');

  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const [tempStoreNameFilter, setTempStoreNameFilter] = useState<string>('');
  const [tempTalukaFilter, setTempTalukaFilter] = useState<string>('');
  const [tempSheetNameFilter, setTempSheetNameFilter] = useState<string>('');
  const [tempFileNameFilter, setTempFileNameFilter] = useState<string>('');

  type EnquiryApiQueryKey = [
    string,
    string,
    string,
    string,
    string,
    string,
    string
  ];

  const fetchEnquiries = useCallback(async (context: QueryFunctionContext<EnquiryApiQueryKey>): Promise<Enquiry[]> => {
    const [_key, startMonth, endMonth, storeName, taluka, sheetName, fileName] = context.queryKey;
    if (!token) throw new Error('No token available. Please log in.');

    const queryParams = new URLSearchParams();
    let baseUrl = 'http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/enquiry/';

    const hasTextFilters = storeName || taluka || sheetName || fileName;

    if (hasTextFilters) {
      baseUrl += 'filter';
      if (storeName) queryParams.append('storeName', storeName);
      if (taluka) queryParams.append('taluka', taluka);
      if (sheetName) queryParams.append('sheetName', sheetName);
      if (fileName) queryParams.append('fileName', fileName);
      if (startMonth) queryParams.append('startMonth', startMonth);
      if (endMonth) queryParams.append('endMonth', endMonth);
    } else if (startMonth && endMonth) {
      baseUrl += 'range';
      queryParams.append('startMonth', startMonth);
      queryParams.append('endMonth', endMonth);
    } else {
      baseUrl += 'getAll';
    }

    const endpoint = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    const response = await fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Network response was not ok while fetching enquiries: ${errorData || response.statusText}`);
    }
    return response.json();
  }, [token]);

  const { data: enquiriesDataFromApi, isLoading, isError, error, refetch } = useQuery<Enquiry[], Error, Enquiry[], EnquiryApiQueryKey>(
    ['enquiriesApi', 
      formatDateToMMMyy(startDate), 
      formatDateToMMMyy(endDate),
      storeNameFilter,
      talukaFilter,
      sheetNameFilter,
      fileNameFilter
    ],
    fetchEnquiries,
    {
      enabled: !!token,
      retry: 1,
    }
  );

  const filteredEnquiries = React.useMemo(() => {
    return enquiriesDataFromApi || [];
  }, [enquiriesDataFromApi]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) { setUploadMessage('Please select a file first.'); return; }
    if (!token) { setUploadMessage('Authentication token not found. Please log in.'); return; }
    setIsUploading(true);
    setUploadMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('http://ec2-3-88-111-83.compute-1.amazonaws.com:8081/enquiry/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const responseText = await response.text();
      if (response.ok && responseText === 'File uploaded successfully') {
        setUploadMessage('File uploaded successfully!');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
      } else if (response.ok) {
        setUploadMessage(responseText);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        refetch();
      } else {
        setUploadMessage(`Upload failed: ${responseText || response.statusText}`);
      }
    } catch (e: any) {
      setUploadMessage(`Upload error: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyFilters = () => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setStoreNameFilter(tempStoreNameFilter);
    setTalukaFilter(tempTalukaFilter);
    setSheetNameFilter(tempSheetNameFilter);
    setFileNameFilter(tempFileNameFilter);
  };

  const handleClearFilters = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    setTempStoreNameFilter('');
    setTempTalukaFilter('');
    setTempSheetNameFilter('');
    setTempFileNameFilter('');
    setStartDate(undefined);
    setEndDate(undefined);
    setStoreNameFilter('');
    setTalukaFilter('');
    setSheetNameFilter('');
    setFileNameFilter('');
  };

  const baseDisplayColumns = ['Sheet Name', 'File Name', 'Taluka', 'Population', 'Store Name', 'Expenses', 'Phone'];
  const salesMonths = React.useMemo(() => {
    const months = new Set<string>();
    filteredEnquiries.forEach((enquiry: Enquiry) => {
      if (enquiry.sales) {
        Object.keys(enquiry.sales).forEach(month => months.add(month));
      }
    });
    return Array.from(months).sort();
  }, [filteredEnquiries]);
  const tableDisplayColumns = [...baseDisplayColumns, ...salesMonths, 'Total Sales'];

  const calculateTotalSales = (sales: SalesData | undefined): number => {
    if (!sales) return 0;
    return Object.values(sales).reduce((sum, value) => sum + (Number(value) || 0), 0);
  };

  const renderMainContent = () => {
    if (!token && !isLoading) {
      return <p className="text-red-500">Authentication token not found. Please log in to view enquiries.</p>;
    }
    if (isLoading) return <p>Loading enquiries from API...</p>;
    if (isError) return <p className="text-red-500">Error fetching enquiries: {error?.message}</p>;
    return (
      <div className="overflow-x-auto shadow-md sm:rounded-lg mt-4">
        <Table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <TableCaption className="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Enquiry Data
            <p className="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Browse a list of your recent enquiries, filter by date range and other criteria.</p>
          </TableCaption>
          <TableHeader className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <TableRow>
              {tableDisplayColumns.map((column) => (
                <TableHead key={column} scope="col" className="px-6 py-3">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnquiries.map((enquiry: Enquiry) => (
              <TableRow key={enquiry.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <TableCell className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{enquiry.sheetName}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.fileName}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.taluka}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.population}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.dealerName}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.expenses}</TableCell>
                <TableCell className="px-6 py-4">{enquiry.contactNumber}</TableCell>
                {salesMonths.map(month => (
                  <TableCell key={month} className="px-6 py-4">
                    {enquiry.sales?.[month] ?? 0}
                  </TableCell>
                ))}
                <TableCell className="px-6 py-4 font-semibold">
                  {calculateTotalSales(enquiry.sales)}
                </TableCell>
              </TableRow>
            ))}
            {filteredEnquiries.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={tableDisplayColumns.length} className="px-6 py-4 text-center text-gray-500">
                  No enquiries found for the selected criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="container-enquiries mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-4xl font-bold">Enquiries</h1>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            id="fileUploadEnquiry"
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
            accept=".xlsx,.xls,.csv"
          />
          <label 
            htmlFor="fileUploadEnquiry" 
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 cursor-pointer"
           >Select File</label>
          {selectedFile && <span className="text-sm text-gray-600">{selectedFile.name}</span>}
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile} className="whitespace-nowrap bg-black hover:bg-gray-800 text-white">
            {isUploading ? 'Uploading...' : 'Upload Data'}
          </Button>
        </div>
      </div>
      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-md text-sm ${uploadMessage.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {uploadMessage}
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-4 items-end">
          <div>
            <label htmlFor="storeNameFilter" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <Input 
              id="storeNameFilter"
              type="text" 
              placeholder="Enter Store Name"
              value={tempStoreNameFilter} 
              onChange={(e) => setTempStoreNameFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          <div>
            <label htmlFor="talukaFilter" className="block text-sm font-medium text-gray-700 mb-1">Taluka</label>
            <Input 
              id="talukaFilter"
              type="text" 
              placeholder="Enter Taluka"
              value={tempTalukaFilter} 
              onChange={(e) => setTempTalukaFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          <div>
            <label htmlFor="sheetNameFilter" className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
            <Input 
              id="sheetNameFilter"
              type="text" 
              placeholder="Enter Sheet Name"
              value={tempSheetNameFilter} 
              onChange={(e) => setTempSheetNameFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          <div>
            <label htmlFor="fileNameFilter" className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <Input 
              id="fileNameFilter"
              type="text" 
              placeholder="Enter File Name"
              value={tempFileNameFilter} 
              onChange={(e) => setTempFileNameFilter(e.target.value)} 
              className="h-9 w-full"
            />
          </div>
          
          <div>
            <label htmlFor="fromDateFilter" className="block text-sm font-medium text-gray-700 mb-1">From Date </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="fromDateFilter"
                  variant={"outline"}
                  className={`h-9 w-full justify-start text-left font-normal ${!tempStartDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempStartDate ? formatDateToMMMyy(tempStartDate) : <span>Pick a start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={tempStartDate}
                  onSelect={setTempStartDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label htmlFor="toDateFilter" className="block text-sm font-medium text-gray-700 mb-1">To Date </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="toDateFilter"
                  variant={"outline"}
                  className={`h-9 w-full justify-start text-left font-normal ${!tempEndDate && "text-muted-foreground"}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {tempEndDate ? formatDateToMMMyy(tempEndDate) : <span>Pick an end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={tempEndDate}
                  onSelect={setTempEndDate}
                  disabled={(date) => tempStartDate ? date < tempStartDate : false}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-2 items-end sm:col-span-2 md:col-span-1 lg:col-span-1 xl:col-span-1 justify-start pt-5">
            <Button onClick={handleApplyFilters} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">Apply</Button>
            <Button variant="outline" onClick={handleClearFilters} className="w-full sm:w-auto">Clear</Button>
          </div>
        </div>
      </div>

      {renderMainContent()}
    </div>
  );
};

const EnquiriesPage: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <EnquiriesPageContent />
    </QueryClientProvider>
  );
};

export default EnquiriesPage;