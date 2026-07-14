API Specification
1. Base API URLhttps://{domain}/api/v1

2. The Unified JSON ResponseEvery endpoint (regardless of success or failure) must map to this exact structure.Success Example:{
  "success": true,
  "message": "Vendor created successfully.",
  "data": {
    "id": 1,
    "name": "Tech Corp"
  },
  "errors": null
}
Validation Error Example (422):{
  "success": false,
  "message": "The given data was invalid.",
  "data": null,
  "errors": {
    "email": ["The email has already been taken."]
  }
}
3. Standard Query Parameters (Index Endpoints)Pagination: ?page=1&per_page=15Sorting: ?sort=name_en (Ascending) or ?sort=-created_at (Descending).Searching: ?search=ERP (Searches predefined columns in the backend service).