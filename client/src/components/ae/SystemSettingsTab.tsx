/**
 * System Settings Tab — Media/Product catalog and system configuration
 * Design: Modern SaaS — Clean settings panel
 */
import { useState } from "react";
import { Settings, Plus, Trash2, Save, Tv, Package, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/database";
import { toast } from "sonner";

export default function SystemSettingsTab() {
  const settings = db.getSettings();

  const [companyName, setCompanyName] = useState(settings.companyName || "MediaFlow");
  const [mediaItems, setMediaItems] = useState<string[]>(settings.mediaItems || []);
  const [productItems, setProductItems] = useState<string[]>(settings.productItems || []);
  const [newMedia, setNewMedia] = useState("");
  const [newProduct, setNewProduct] = useState("");

  const handleSave = () => {
    db.updateSettings({ companyName, mediaItems, productItems });
    toast.success("บันทึกการตั้งค่าแล้ว");
  };

  const addMedia = () => {
    const v = newMedia.trim();
    if (!v) return;
    if (mediaItems.includes(v)) { toast.error("มีชื่อ Media นี้แล้ว"); return; }
    setMediaItems((prev) => [...prev, v]);
    setNewMedia("");
  };

  const removeMedia = (item: string) => setMediaItems((prev) => prev.filter((m) => m !== item));

  const addProduct = () => {
    const v = newProduct.trim();
    if (!v) return;
    if (productItems.includes(v)) { toast.error("มีชื่อ Product นี้แล้ว"); return; }
    setProductItems((prev) => [...prev, v]);
    setNewProduct("");
  };

  const removeProduct = (item: string) => setProductItems((prev) => prev.filter((p) => p !== item));

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Company Info */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">ข้อมูลบริษัท</p>
            <p className="text-xs text-muted-foreground">ชื่อที่แสดงในระบบ</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label>ชื่อบริษัท / Media House</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="เช่น MediaFlow Co., Ltd." />
          </div>
        </div>
      </div>

      {/* Media Catalog */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Media</p>
            <p className="text-xs text-muted-foreground">ชื่อเพจที่ให้บริการ สำหรับใช้ใน Revenue Breakdown</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="เช่น Facebook Page A, IG @brand, TikTok Official"
              value={newMedia}
              onChange={(e) => setNewMedia(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMedia()}
            />
            <Button onClick={addMedia} size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1 flex-shrink-0">
              <Plus className="w-4 h-4" /> เพิ่ม
            </Button>
          </div>
          {mediaItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มี Media — เพิ่มชื่อเพจด้านบน</p>
          ) : (
            <div className="space-y-2">
              {mediaItems.map((item) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg">
                  <Tv className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item}</span>
                  <button onClick={() => removeMedia(item)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Catalog */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">Product Type</p>
            <p className="text-xs text-muted-foreground">ประเภทบริการที่ให้ในเพจ เช่น Sponsor Post, Ads Budget</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="เช่น Sponsor Post, Ads Budget, Ads Management Fee, Other Fee"
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProduct()}
            />
            <Button onClick={addProduct} size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1 flex-shrink-0">
              <Plus className="w-4 h-4" /> เพิ่ม
            </Button>
          </div>
          {productItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มี Product Type — เพิ่มประเภทบริการด้านบน</p>
          ) : (
            <div className="space-y-2">
              {productItems.map((item) => (
                <div key={item} className="flex items-center gap-3 px-3 py-2.5 bg-muted/50 rounded-lg">
                  <Package className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium">{item}</span>
                  <button onClick={() => removeProduct(item)} className="text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
        <Save className="w-4 h-4" /> บันทึกการตั้งค่าทั้งหมด
      </Button>
    </div>
  );
}
