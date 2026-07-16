import React, { useState, useRef } from "react";
import { 
  FileSpreadsheet, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  RefreshCw, 
  Check, 
  FileText,
  HelpCircle,
  TrendingUp,
  X
} from "lucide-react";

interface AdminBulkUploadProps {
  onSuccess: () => void;
  showToast: (msg: string) => void;
}

interface ValidationRow {
  rowNum: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: Record<string, string>;
}

export const AdminBulkUpload: React.FC<AdminBulkUploadProps> = ({ onSuccess, showToast }) => {
  const [csvText, setCsvText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    total: number;
    validCount: number;
    invalidCount: number;
    rows: ValidationRow[];
  } | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPastedInput, setShowPastedInput] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Robust CSV parser supporting quotes and escaped quotes
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i+1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(cell.trim());
        cell = "";
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell.trim());
        lines.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }
    
    if (cell || row.length > 0) {
      row.push(cell.trim());
      lines.push(row);
    }
    
    // Filter empty lines
    return lines.filter(r => r.length > 0 && r.some(c => c !== ""));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      validateCSVContent(text);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".csv")) {
      showToast("❌ Only CSV files are supported!");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCsvText(text);
      validateCSVContent(text);
    };
    reader.readAsText(file);
  };

  // Maps normalized headers to keys
  const headerKeys = {
    productidsku: ["productidsku", "sku", "productid", "id", "skuproductid"],
    productname: ["productname", "name", "title", "producttitle"],
    brand: ["brand", "manufacturer"],
    category: ["category", "categoryname", "productcategory"],
    price: ["price", "price৳", "cost"],
    regularprice: ["regularprice", "oldprice", "originalprice"],
    stockquantity: ["stockquantity", "stock", "quantity", "qty"],
    productimage: ["productimage", "image", "mainimage", "thumbnail"],
    galleryimages: ["galleryimages", "gallery", "additionalimages"],
    shortdescription: ["shortdescription", "shortdesc", "summary"],
    fulldescription: ["fulldescription", "fulldesc", "description", "details"],
    features: ["features", "highlights", "bulletpoints"],
    color: ["color", "colours"],
    size: ["size", "sizes"],
    weight: ["weight", "productweight"],
    waterresistance: ["waterresistance", "waterproof", "resistance"],
    countryoforigin: ["countryoforigin", "country", "origin"],
    warranty: ["warranty", "productwarranty"]
  };

  const validateCSVContent = (rawText: string) => {
    const rows = parseCSV(rawText);
    if (rows.length < 2) {
      showToast("❌ CSV must include a header row and at least 1 product row!");
      return;
    }

    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ""));
    const dataRows = rows.slice(1);

    // Build map of header index
    const headerMap: Record<string, number> = {};
    headers.forEach((h, idx) => {
      headerMap[h] = idx;
    });

    const getRowValue = (rowData: string[], normKeys: string[]): string => {
      for (const k of normKeys) {
        const idx = headerMap[k];
        if (idx !== undefined && rowData[idx] !== undefined) {
          return rowData[idx];
        }
      }
      return "";
    };

    const validatedRows: ValidationRow[] = dataRows.map((rowData, index) => {
      const rowNum = index + 2; // Row numbers are 1-based, index 0 is row 2
      const data: Record<string, string> = {};
      const errors: Record<string, string> = {};

      // Map parsed columns to our explicit targets
      Object.entries(headerKeys).forEach(([key, aliases]) => {
        data[key] = getRowValue(rowData, aliases);
      });

      // --- CELL LEVEL VALIDATION ---
      
      // 1. SKU
      if (!data.productidsku) {
        errors.productidsku = "SKU is required";
      }

      // 2. Product Name
      if (!data.productname) {
        errors.productname = "Product name is required";
      }

      // 3. Brand
      if (!data.brand) {
        errors.brand = "Brand is required";
      }

      // 4. Category
      if (!data.category) {
        errors.category = "Category is required";
      }

      // 5. Price
      if (!data.price) {
        errors.price = "Price is required";
      } else {
        const pNum = Number(data.price);
        if (isNaN(pNum) || pNum <= 0) {
          errors.price = "Price must be a valid positive number";
        }
      }

      // 6. Regular Price (Optional)
      if (data.regularprice) {
        const rpNum = Number(data.regularprice);
        if (isNaN(rpNum) || rpNum <= 0) {
          errors.regularprice = "Regular price must be a valid number";
        }
      }

      // 7. Stock Quantity
      if (!data.stockquantity) {
        errors.stockquantity = "Stock Quantity is required";
      } else {
        const sNum = Number(data.stockquantity);
        if (isNaN(sNum) || sNum < 0) {
          errors.stockquantity = "Stock must be a non-negative number";
        }
      }

      // 8. Product Image
      if (!data.productimage) {
        errors.productimage = "Product Image URL is required";
      } else if (!data.productimage.startsWith("http://") && !data.productimage.startsWith("https://")) {
        errors.productimage = "Product Image must be a valid URL";
      }

      // 9. Short Description
      if (!data.shortdescription) {
        errors.shortdescription = "Short description is required";
      }

      // 10. Full Description
      if (!data.fulldescription) {
        errors.fulldescription = "Full description is required";
      }

      // 11. Features
      if (!data.features) {
        errors.features = "Features list is required";
      }

      // 12. Color
      if (!data.color) {
        errors.color = "Color is required";
      }

      // 13. Water Resistance
      if (!data.waterresistance) {
        errors.waterresistance = "Water resistance rating is required";
      }

      // 14. Country of Origin
      if (!data.countryoforigin) {
        errors.countryoforigin = "Country of origin is required";
      }

      // 15. Warranty
      if (!data.warranty) {
        errors.warranty = "Warranty info is required";
      }

      const isValid = Object.keys(errors).length === 0;

      return {
        rowNum,
        data,
        isValid,
        errors
      };
    });

    const total = validatedRows.length;
    const validCount = validatedRows.filter(r => r.isValid).length;
    const invalidCount = total - validCount;

    setValidationResult({
      total,
      validCount,
      invalidCount,
      rows: validatedRows
    });
  };

  const handleUploadSubmit = async () => {
    if (!validationResult || validationResult.invalidCount > 0) return;
    
    setIsUploading(true);
    try {
      // Map validationResult rows into array for API
      const productsToUpload = validationResult.rows.map(r => r.data);
      
      const resp = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: productsToUpload })
      });

      if (resp.ok) {
        setUploadSuccess(true);
        showToast(`🎉 Successfully uploaded ${productsToUpload.length} products!`);
        setTimeout(() => {
          setUploadSuccess(false);
          setValidationResult(null);
          setCsvText("");
          onSuccess(); // Refresh parents
        }, 1500);
      } else {
        throw new Error("Failed to save products in bulk");
      }
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to import products to database.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "Product ID / SKU",
      "Product Name",
      "Brand",
      "Category",
      "Price",
      "Regular Price",
      "Stock Quantity",
      "Product Image",
      "Gallery Images",
      "Short Description",
      "Full Description",
      "Features",
      "Color",
      "Size",
      "Weight",
      "Water Resistance",
      "Country of Origin",
      "Warranty"
    ];
    
    const sampleRow = [
      "NS-7721",
      "Premium Pure Cotton Punjabi",
      "Naim Shop",
      "Punjabi",
      "2200",
      "3000",
      "50",
      "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=600",
      "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=400",
      "Premium high comfort ethnic wear for festivals.",
      "Beautifully detailed pure cotton weaves with high-end fabrics and maximum long term design styling comfort.",
      "Elegant design, Breathable material, Double stitched locks",
      "Navy Blue",
      "M, L, XL, XXL",
      "0.4 KG",
      "No",
      "Bangladesh",
      "6 Months Brand Warranty"
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), sampleRow.map(v => `"${v.replace(/"/g, '""')}"`).join(",")].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "naim_shop_bulk_upload_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("⬇️ Template downloaded successfully!");
  };

  const downloadErrorReport = () => {
    if (!validationResult || validationResult.invalidCount === 0) return;

    const headers = ["Row #", "SKU / ID", "Product Name", "Column / Field Name", "Error Message"];
    const csvRows = [headers.join(",")];

    validationResult.rows.forEach(r => {
      if (!r.isValid) {
        Object.entries(r.errors).forEach(([field, errorMsg]) => {
          const rowData = [
            r.rowNum,
            r.data.productidsku || "N/A",
            r.data.productname || "N/A",
            field,
            errorMsg
          ];
          csvRows.push(rowData.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","));
        });
      }
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bulk_upload_error_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("⬇️ Error report downloaded successfully!");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-50 text-[#6426ff] rounded-lg flex items-center justify-center">
            <FileSpreadsheet size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-[13px] text-slate-900 leading-tight">
              Bulk Product Upload
            </h4>
            <p className="text-[9px] text-[#6426ff] font-bold">18-Column Validation System</p>
          </div>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 px-2 py-1.5 rounded-lg cursor-pointer font-extrabold transition-all active:scale-[0.98]"
        >
          <Download size={11} />
          <span>Get Template</span>
        </button>
      </div>

      {/* Guide Card */}
      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/40 text-[10px] text-slate-600 leading-relaxed space-y-1">
        <div className="flex items-center gap-1 font-extrabold text-indigo-700">
          <HelpCircle size={12} />
          <span>Upload Guidelines:</span>
        </div>
        <p>1. Must use a CSV format file containing all 18 specified required column headers.</p>
        <p>2. Required fields (SKU, Name, Price, Stock, Image, descriptions, color, origin, warranty) cannot be empty.</p>
        <p>3. If any row contains empty or invalid values, the submission button will remain disabled.</p>
      </div>

      {/* Main Drag-and-drop or Pasted input container */}
      {!validationResult && (
        <div className="space-y-4">
          {/* File Input */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? "border-[#6426ff] bg-indigo-50/30" 
                : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <UploadCloud size={32} className="text-slate-400 mb-2" />
            <p className="text-xs font-black text-slate-800">Drag & Drop Product CSV File</p>
            <p className="text-[10px] text-slate-450 mt-1">or click to browse from device</p>
          </div>

          {/* Pasted Input Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowPastedInput(!showPastedInput)}
              className="text-[10px] font-extrabold text-[#6426ff] hover:underline"
            >
              {showPastedInput ? "Hide CSV text box" : "Or paste raw CSV text instead"}
            </button>
          </div>

          {showPastedInput && (
            <div className="space-y-2">
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Product ID / SKU,Product Name,Brand,Category,Price,Regular Price,Stock Quantity,Product Image,Gallery Images,Short Description,Full Description,Features,Color,Size,Weight,Water Resistance,Country of Origin,Warranty&#10;NS-101,Sample Shirt,Naim Shop,T-Shirt,1200,,100,https://example.com/img.jpg,,Nice shirt,Full high comfort design,100% cotton,Blue,M; L,,No,Bangladesh,No warranty"
                className="w-full border border-slate-200 rounded-xl p-3 font-mono text-[10px] outline-none focus:border-[#6426ff]"
              />
              <button
                type="button"
                onClick={() => validateCSVContent(csvText)}
                disabled={!csvText.trim()}
                className="w-full h-10 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 font-black text-xs border-none cursor-pointer rounded-xl transition-all active:scale-[0.98]"
              >
                Validate Pasted CSV Text
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validation Result Display */}
      {validationResult && (
        <div className="space-y-4 animate-fade-in">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-center">
              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Total Checked</span>
              <span className="text-sm font-black text-slate-800 mt-0.5 block">{validationResult.total} Rows</span>
            </div>
            
            <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <span className="text-[8px] text-emerald-500 font-extrabold uppercase tracking-wider block">Valid Rows</span>
              <span className="text-sm font-black text-emerald-600 mt-0.5 block flex items-center justify-center gap-0.5">
                <CheckCircle2 size={12} />
                <span>{validationResult.validCount}</span>
              </span>
            </div>

            <div className={`p-2.5 border rounded-xl text-center ${
              validationResult.invalidCount > 0 
                ? "bg-rose-50 border-rose-100 text-rose-600" 
                : "bg-slate-50 border-slate-100 text-slate-450"
            }`}>
              <span className="text-[8px] font-bold uppercase tracking-wider block">Invalid Rows</span>
              <span className="text-sm font-black mt-0.5 block flex items-center justify-center gap-0.5">
                {validationResult.invalidCount > 0 && <AlertCircle size={12} />}
                <span>{validationResult.invalidCount}</span>
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setValidationResult(null)}
              className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl cursor-pointer border-none transition-all active:scale-[0.98]"
            >
              Clear & Reset
            </button>
            
            {validationResult.invalidCount > 0 ? (
              <button
                type="button"
                onClick={downloadErrorReport}
                className="flex-1 h-10 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-600 font-extrabold text-xs rounded-xl cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <Download size={12} />
                <span>Error Report</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={isUploading || uploadSuccess}
                className="flex-1 h-10 bg-[#6426ff] hover:bg-[#521be3] text-white font-black text-xs rounded-xl cursor-pointer border-none transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15"
              >
                {isUploading ? (
                  <RefreshCw className="animate-spin" size={13} />
                ) : uploadSuccess ? (
                  <Check size={13} />
                ) : (
                  <UploadCloud size={13} />
                )}
                <span>{isUploading ? "Uploading..." : uploadSuccess ? "Uploaded!" : "Upload Products"}</span>
              </button>
            )}
          </div>

          {/* Data Table Preview */}
          <div className="space-y-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Row-by-Row Cell Validation Details</span>
            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto divide-y divide-slate-100 shadow-sm bg-slate-50/30">
              {validationResult.rows.map((r) => (
                <div 
                  key={r.rowNum} 
                  className={`p-3 text-[10px] space-y-1.5 ${
                    r.isValid ? "bg-white border-l-4 border-emerald-500" : "bg-rose-50/20 border-l-4 border-rose-500"
                  }`}
                >
                  {/* Row meta */}
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-500">Row #{r.rowNum}</span>
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                      r.isValid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    }`}>
                      {r.isValid ? "✓ Valid Row" : "❌ Invalid Cell Data"}
                    </span>
                  </div>

                  {/* Product summary */}
                  <div className="grid grid-cols-4 gap-2 text-slate-700">
                    <div className="col-span-2">
                      <span className="text-[8px] text-slate-400 block font-bold">Product Title</span>
                      <span className="font-extrabold truncate block">{r.data.productname || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block font-bold">SKU / ID</span>
                      <span className="font-mono text-slate-500 truncate block">{r.data.productidsku || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block font-bold">Price</span>
                      <span className="font-extrabold text-indigo-600 block">৳{r.data.price || "0"}</span>
                    </div>
                  </div>

                  {/* Errors block */}
                  {!r.isValid && (
                    <div className="mt-1.5 p-2 bg-rose-50 border border-rose-100 rounded-lg space-y-1">
                      {Object.entries(r.errors).map(([field, err]) => (
                        <div key={field} className="flex items-start gap-1 text-rose-600 font-extrabold text-[9px]">
                          <AlertCircle size={10} className="shrink-0 mt-0.5" />
                          <span>
                            <strong className="capitalize">{field.replace("productidsku", "SKU").replace("productimage", "Image").replace("productname", "Name")}:</strong> {err}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
