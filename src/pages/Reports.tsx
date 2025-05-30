import React from 'react';
import FieldOfficerVisitReport from '../components/FieldOfficerVisitReport';
import './Report.css'; // Ensure this CSS file is imported

const Reports = () => {
    return (
        // Apply max-w-6xl here, remove mx-auto as CSS will handle positioning 
        <div className="container-reports px-4 py-4 max-w-6xl">
            {/* The main title from the old Reports page can be kept if desired, or managed within FieldOfficerVisitReport */}
            {/* <div className="container-header-reports">
                <h1 className="text-2xl font-bold mb-4 text-gray-800">Reports</h1>
            </div> */}
            
            <FieldOfficerVisitReport />
        </div>
    );
};

export default Reports;