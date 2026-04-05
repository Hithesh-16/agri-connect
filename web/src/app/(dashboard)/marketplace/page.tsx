"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ShoppingBag,
  Plus,
  X,
  MapPin,
  Clock,
  Phone,
  Send,
  Tag,
  Loader2,
  Search,
  Wheat,
  Tractor,
  Bug,
  Beaker,
  Sprout,
  Wrench,
  Droplets,
  Users,
  Package,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  ArrowRight,
  Check,
  MessageSquare,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useI18n } from "@/lib/i18n";
import {
  useListings,
  useCreateListing,
  useSendInquiry,
  type ListingType as OldListingType,
  type Listing,
  type CreateListingPayload,
} from "@/hooks/useListings";
import {
  useInventory,
  useInventorySearch,
  getLocalizedName,
  FALLBACK_CATEGORIES,
  type InventoryCategory,
  type InventoryItem,
} from "@/hooks/useInventory";

type ExtendedListingType = "selling" | "buying" | "renting" | "exchange";

const CATEGORY_TABS = [
  { id: "all", icon: ShoppingBag, labelKey: "marketplace.allCategories" },
  { id: "crops", icon: Wheat, names: { en: "Crops", te: "పంటలు", hi: "फ़सलें" } },
  { id: "machinery", icon: Tractor, names: { en: "Machinery", te: "యంత్రాలు", hi: "मशीनरी" } },
  { id: "pesticides", icon: Bug, names: { en: "Pesticides", te: "పురుగుమందులు", hi: "कीटनाशक" } },
  { id: "fertilizers", icon: Beaker, names: { en: "Fertilizers", te: "ఎరువులు", hi: "उर्वरक" } },
  { id: "seeds", icon: Sprout, names: { en: "Seeds", te: "విత్తనాలు", hi: "बीज" } },
  { id: "tools", icon: Wrench, names: { en: "Tools", te: "పరికరాలు", hi: "उपकरण" } },
  { id: "irrigation", icon: Droplets, names: { en: "Irrigation", te: "నీటిపారుదల", hi: "सिंचाई" } },
  { id: "labor", icon: Users, names: { en: "Labor", te: "కూలీలు", hi: "श्रमिक" } },
  { id: "post-harvest", icon: Package, names: { en: "Post-Harvest", te: "పంట తర్వాత", hi: "कटाई बाद" } },
];

const TYPE_COLORS: Record<ExtendedListingType, { bg: string; text: string; label: string }> = {
  selling: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400", label: "selling" },
  buying: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "buying" },
  renting: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-400", label: "renting" },
  exchange: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-400", label: "exchange" },
};

const CONDITION_OPTIONS = [
  { id: "new", labelKey: "marketplace.new" },
  { id: "used", labelKey: "marketplace.used" },
  { id: "half-used", labelKey: "marketplace.halfUsed" },
];

const RENTAL_BASIS_OPTIONS = [
  { id: "per_day", label: "Per Day" },
  { id: "per_hour", label: "Per Hour" },
  { id: "per_acre", label: "Per Acre" },
];

function daysSince(dateStr: string): string {
  const posted = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

export default function MarketplacePage() {
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | ExtendedListingType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [inquiryListing, setInquiryListing] = useState<Listing | null>(null);

  const filters = useMemo(() => {
    const f: { type?: OldListingType; cropId?: string } = {};
    if (typeFilter === "selling" || typeFilter === "buying") f.type = typeFilter;
    return f;
  }, [typeFilter]);

  const { data: listings, isLoading } = useListings(filters);
  const { data: inventoryCategories } = useInventory();
  const { data: searchResults } = useInventorySearch(searchQuery);

  const displayListings = useMemo(() => {
    let result = listings || [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.cropName.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== "all" && categoryFilter !== "crops") {
      result = result.filter((l) => {
        const cat = inventoryCategories?.find((c) => c.id === categoryFilter);
        if (!cat) return false;
        return cat.items.some(
          (item) =>
            item.names.en.toLowerCase() === l.cropName.toLowerCase() ||
            l.cropName.toLowerCase().includes(cat.names.en.toLowerCase())
        );
      });
    }
    return result;
  }, [listings, searchQuery, categoryFilter, inventoryCategories]);

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">
              {t("marketplace.title")}
            </h1>
            <p className="text-xs text-kisan-text-secondary">
              {locale === "te"
                ? "వ్యవసాయ వస్తువులు కొనండి & అమ్మండి"
                : locale === "hi"
                ? "कृषि सामान खरीदें और बेचें"
                : "Buy & sell agricultural goods"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("marketplace.createListing")}</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {CATEGORY_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const label = tab.labelKey
            ? t(tab.labelKey)
            : tab.names
            ? getLocalizedName(tab.names, locale)
            : tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border whitespace-nowrap shrink-0",
                categoryFilter === tab.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700 hover:border-primary/40"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Listing Type Pills */}
      <div className="flex gap-2">
        {(["all", "selling", "buying", "renting", "exchange"] as const).map((type) => {
          const label =
            type === "all"
              ? t("marketplace.allCategories")
              : t(`marketplace.${type === "renting" ? "renting" : type}`);
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                typeFilter === type
                  ? type === "all"
                    ? "bg-primary/10 text-primary border-primary/30"
                    : `${TYPE_COLORS[type].bg} ${TYPE_COLORS[type].text} border-transparent`
                  : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kisan-text-light" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            locale === "te"
              ? "వస్తువు లేదా పంట శోధించండి..."
              : locale === "hi"
              ? "सामान या फ़सल खोजें..."
              : "Search items, crops, machinery..."
          }
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {searchQuery && searchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-kisan-border dark:border-gray-700 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSearchQuery(getLocalizedName(item.names, locale));
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <span className="text-kisan-text dark:text-gray-200">
                  {getLocalizedName(item.names, locale)}
                </span>
                <span className="text-[10px] text-kisan-text-light">{item.categoryId}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : displayListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              locale={locale}
              t={t}
              onInquiry={() => setInquiryListing(listing)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-orange-300" />
          </div>
          <p className="text-kisan-text-secondary text-sm font-medium">
            {t("marketplace.noListings")}
          </p>
          <p className="text-kisan-text-light text-xs mt-1">{t("marketplace.beFirst")}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            {t("marketplace.createListing")}
          </button>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateModal && (
        <CreateListingModal
          locale={locale}
          t={t}
          categories={inventoryCategories || FALLBACK_CATEGORIES}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Inquiry Modal */}
      {inquiryListing && (
        <InquiryModal
          listing={inquiryListing}
          t={t}
          onClose={() => setInquiryListing(null)}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  locale,
  t,
  onInquiry,
}: {
  listing: Listing;
  locale: string;
  t: (key: string) => string;
  onInquiry: () => void;
}) {
  const listingType = listing.type as ExtendedListingType;
  const typeStyle = TYPE_COLORS[listingType] || TYPE_COLORS.selling;
  const typeLabel = t(`marketplace.${listingType === "renting" ? "renting" : listingType}`);

  const getCategoryForListing = (): { icon: typeof ShoppingBag; color: string } | null => {
    const name = listing.cropName.toLowerCase();
    if (name.includes("tractor") || name.includes("harvester") || name.includes("pump"))
      return { icon: Tractor, color: "text-gray-600 bg-gray-100 dark:bg-gray-700" };
    if (name.includes("urea") || name.includes("dap") || name.includes("fertiliz"))
      return { icon: Beaker, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" };
    if (name.includes("seed"))
      return { icon: Sprout, color: "text-green-600 bg-green-100 dark:bg-green-900/30" };
    if (name.includes("pesticide") || name.includes("insecticide"))
      return { icon: Bug, color: "text-red-600 bg-red-100 dark:bg-red-900/30" };
    return { icon: Wheat, color: "text-amber-700 bg-amber-50 dark:bg-amber-900/20" };
  };

  const categoryInfo = getCategoryForListing();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 p-4 hover:shadow-md transition-all">
      {/* Top Row: Category Badge + Type Badge + Time */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {categoryInfo && (
            <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", categoryInfo.color)}>
              <categoryInfo.icon className="w-3 h-3" />
            </span>
          )}
          <span
            className={cn(
              "text-[10px] font-bold uppercase px-2.5 py-1 rounded-full",
              typeStyle.bg,
              typeStyle.text
            )}
          >
            {typeLabel}
          </span>
        </div>
        <span className="text-[10px] text-kisan-text-light whitespace-nowrap">
          {daysSince(listing.postedDate)}
        </span>
      </div>

      {/* Item Name */}
      <h3 className="font-semibold text-kisan-text dark:text-gray-100">{listing.cropName}</h3>

      {/* Details */}
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-kisan-text-secondary">
          <Tag className="w-3.5 h-3.5 shrink-0" />
          <span>
            {listing.quantity} {listing.unit}
            {listing.pricePerUnit && (
              <>
                {" "}
                at{" "}
                <span className="font-semibold text-primary">
                  {formatCurrency(listing.pricePerUnit)}/{listing.unit}
                </span>
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-kisan-text-secondary">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{listing.mandiName || listing.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-kisan-text-secondary">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>
            {locale === "te" ? "పోస్ట్ చేసిన వారు" : locale === "hi" ? "पोस्ट किया" : "Posted by"}{" "}
            {listing.postedBy}
          </span>
        </div>
      </div>

      {listing.description && (
        <p className="text-xs text-kisan-text-secondary mt-2 line-clamp-2">{listing.description}</p>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        {listing.contactPhone && (
          <a
            href={`tel:${listing.contactPhone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all"
          >
            <Phone className="w-4 h-4" />
            {t("marketplace.callNow")}
          </a>
        )}
        <button
          onClick={onInquiry}
          className={cn(
            "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all",
            listing.contactPhone
              ? "flex-1 bg-gray-100 text-kisan-text hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              : "w-full bg-primary/10 text-primary hover:bg-primary/20"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          {t("marketplace.message")}
        </button>
      </div>
    </div>
  );
}

function CreateListingModal({
  locale,
  t,
  categories,
  onClose,
}: {
  locale: string;
  t: (key: string) => string;
  categories: InventoryCategory[];
  onClose: () => void;
}) {
  const createMutation = useCreateListing();
  const [step, setStep] = useState(1);

  // Step 1: Category
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  // Step 2: Item
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [otherItemName, setOtherItemName] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  // Step 3: Details
  const [listingType, setListingType] = useState<ExtendedListingType>("selling");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState("");
  const [rentalBasis, setRentalBasis] = useState("per_day");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState("");

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const filteredItems = useMemo(() => {
    if (!selectedCategory) return [];
    if (!itemSearch.trim()) return selectedCategory.items;
    const q = itemSearch.toLowerCase();
    return selectedCategory.items.filter(
      (item) =>
        item.names.en.toLowerCase().includes(q) ||
        item.names.te.toLowerCase().includes(q) ||
        item.names.hi.toLowerCase().includes(q)
    );
  }, [selectedCategory, itemSearch]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedItem(null);
    setOtherItemName("");
    setStep(2);
  };

  const handleSelectItem = (item: InventoryItem | null) => {
    setSelectedItem(item);
    if (item) {
      setUnit(item.defaultUnit);
    }
    setStep(3);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const itemName = selectedItem
      ? getLocalizedName(selectedItem.names, "en")
      : otherItemName || "Other";

    const payload: CreateListingPayload = {
      type: listingType === "renting" || listingType === "exchange" ? "selling" : listingType,
      cropId: selectedItem?.id || "other",
      cropName: itemName,
      quantity: Number(quantity) || 1,
      unit: unit || "unit",
      pricePerUnit: price ? Number(price) : undefined,
      description: [
        description,
        condition ? `Condition: ${condition}` : "",
        listingType === "renting" ? `Rental: ${rentalBasis.replace("_", " ")}` : "",
        phoneNumber ? `Phone: ${phoneNumber}` : "",
      ]
        .filter(Boolean)
        .join(". "),
    };
    await createMutation.mutateAsync(payload);
    onClose();
  };

  const allCategoryTabs = [
    ...CATEGORY_TABS.filter((tab) => tab.id !== "all"),
  ];

  const canShowCondition =
    selectedCategoryId === "machinery" ||
    selectedCategoryId === "tools" ||
    selectedCategoryId === "irrigation";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-kisan-border dark:border-gray-700">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-5 h-5 text-kisan-text-secondary" />
              </button>
            )}
            <h2 className="text-lg font-bold text-kisan-text dark:text-gray-100">
              {step === 1
                ? t("marketplace.selectCategory")
                : step === 2
                ? t("marketplace.selectItem")
                : step === 3
                ? t("marketplace.createListing")
                : locale === "te"
                ? "పరిశీలించండి & పోస్ట్ చేయండి"
                : locale === "hi"
                ? "समीक्षा और पोस्ट करें"
                : "Review & Post"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-kisan-text-secondary" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1 px-4 pt-3">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                s <= step ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          ))}
        </div>

        <div className="p-4">
          {/* Step 1: Select Category */}
          {step === 1 && (
            <div className="grid grid-cols-3 gap-3">
              {allCategoryTabs.map((tab) => {
                const TabIcon = tab.icon;
                const label = tab.names
                  ? getLocalizedName(tab.names, locale)
                  : tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectCategory(tab.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-kisan-border dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TabIcon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-kisan-text dark:text-gray-200 text-center">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Select Item */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kisan-text-light" />
                <input
                  type="text"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  placeholder={
                    locale === "te" ? "వస్తువు శోధించండి..." : locale === "hi" ? "वस्तु खोजें..." : "Search item..."
                  }
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-kisan-text dark:text-gray-100">
                        {getLocalizedName(item.names, locale)}
                      </p>
                      {item.brand && (
                        <p className="text-[10px] text-kisan-text-light">{item.brand}</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-kisan-text-light" />
                  </button>
                ))}
              </div>
              {/* Other option */}
              <div className="border-t border-kisan-border dark:border-gray-700 pt-3">
                <p className="text-xs text-kisan-text-light mb-2">
                  {locale === "te"
                    ? "జాబితాలో లేదా?"
                    : locale === "hi"
                    ? "सूची में नहीं?"
                    : "Not in the list?"}
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otherItemName}
                    onChange={(e) => setOtherItemName(e.target.value)}
                    placeholder={
                      locale === "te" ? "వస్తువు పేరు టైప్ చేయండి" : locale === "hi" ? "वस्तु का नाम टाइप करें" : "Type item name"
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={() => {
                      if (otherItemName.trim()) {
                        setSelectedItem(null);
                        setStep(3);
                      }
                    }}
                    disabled={!otherItemName.trim()}
                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Listing Type */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-2">
                  {locale === "te" ? "జాబితా రకం" : locale === "hi" ? "विज्ञापन प्रकार" : "Listing Type"}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["selling", "buying", "renting", "exchange"] as ExtendedListingType[]).map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setListingType(type)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-semibold transition-all border text-center",
                          listingType === type
                            ? `${TYPE_COLORS[type].bg} ${TYPE_COLORS[type].text} border-transparent`
                            : "bg-white dark:bg-gray-700 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                        )}
                      >
                        {t(`marketplace.${type === "renting" ? "renting" : type}`)}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Quantity + Unit */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                    {t("marketplace.quantity")}
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    placeholder="e.g. 50"
                    className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                    {locale === "te" ? "యూనిట్" : locale === "hi" ? "इकाई" : "Unit"}
                  </label>
                  <input
                    type="text"
                    value={
                      unit ||
                      (selectedItem
                        ? getLocalizedName(selectedItem.unitLabels, locale)
                        : "")
                    }
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={selectedItem ? getLocalizedName(selectedItem.unitLabels, locale) : "Unit"}
                    className="w-full px-3 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                  {t("marketplace.pricePerUnit")}{" "}
                  <span className="text-kisan-text-light font-normal">
                    ({locale === "te" ? "ఐచ్ఛికం" : locale === "hi" ? "वैकल्पिक" : "optional"})
                  </span>
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  placeholder="e.g. 6500"
                  className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Condition (for applicable categories) */}
              {canShowCondition && (
                <div>
                  <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-2">
                    {t("marketplace.condition")}
                  </label>
                  <div className="flex gap-2">
                    {CONDITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCondition(opt.id === condition ? "" : opt.id)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                          condition === opt.id
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-white dark:bg-gray-700 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                        )}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Rental Basis (if renting) */}
              {listingType === "renting" && (
                <div>
                  <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-2">
                    {locale === "te" ? "అద్దె ఆధారం" : locale === "hi" ? "किराया आधार" : "Rental Basis"}
                  </label>
                  <div className="flex gap-2">
                    {RENTAL_BASIS_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setRentalBasis(opt.id)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-medium transition-all border",
                          rentalBasis === opt.id
                            ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700"
                            : "bg-white dark:bg-gray-700 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                  {t("marketplace.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder={
                    locale === "te"
                      ? "వివరాలు (రకం, నాణ్యత మొదలైనవి)"
                      : locale === "hi"
                      ? "विवरण (किस्म, गुणवत्ता आदि)"
                      : "Details (variety, quality, etc.)"
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                  {t("marketplace.phone")}
                </label>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-kisan-text-light" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                  {locale === "te" ? "చిత్రాలు (గరిష్ఠం 5)" : locale === "hi" ? "तस्वीरें (अधिकतम 5)" : "Images (up to 5)"}
                </label>
                <div className="flex gap-2 flex-wrap">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-kisan-border dark:border-gray-700">
                      <img
                        src={URL.createObjectURL(file)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-kisan-border dark:border-gray-600 flex items-center justify-center cursor-pointer hover:border-primary transition-all">
                      <ImageIcon className="w-5 h-5 text-kisan-text-light" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                  {locale === "te" ? "ప్రదేశం" : locale === "hi" ? "स्थान" : "Location"}
                </label>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-kisan-text-light" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={
                      locale === "te" ? "నగరం, జిల్లా" : locale === "hi" ? "शहर, ज़िला" : "City, District"
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Next: Preview */}
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!quantity}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {locale === "te" ? "పరిశీలన" : locale === "hi" ? "समीक्षा" : "Preview"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 4: Preview & Submit */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-kisan-text dark:text-gray-100">
                    {selectedItem
                      ? getLocalizedName(selectedItem.names, locale)
                      : otherItemName}
                  </h3>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase px-2.5 py-1 rounded-full",
                      TYPE_COLORS[listingType].bg,
                      TYPE_COLORS[listingType].text
                    )}
                  >
                    {t(`marketplace.${listingType === "renting" ? "renting" : listingType}`)}
                  </span>
                </div>
                <div className="text-xs text-kisan-text-secondary space-y-1">
                  <p>
                    {t("marketplace.quantity")}: {quantity} {unit || selectedItem?.defaultUnit}
                  </p>
                  {price && (
                    <p>
                      {t("marketplace.pricePerUnit")}: {formatCurrency(Number(price))}
                    </p>
                  )}
                  {condition && (
                    <p>
                      {t("marketplace.condition")}: {t(`marketplace.${condition === "half-used" ? "halfUsed" : condition}`)}
                    </p>
                  )}
                  {listingType === "renting" && (
                    <p>
                      {locale === "te" ? "అద్దె" : locale === "hi" ? "किराया" : "Rental"}:{" "}
                      {RENTAL_BASIS_OPTIONS.find((o) => o.id === rentalBasis)?.label}
                    </p>
                  )}
                  {description && <p>{description}</p>}
                  {phoneNumber && (
                    <p>
                      {t("marketplace.phone")}: {phoneNumber}
                    </p>
                  )}
                  {location && (
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {location}
                    </p>
                  )}
                </div>
                {images.length > 0 && (
                  <div className="flex gap-2">
                    {images.map((file, idx) => (
                      <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                <Check className="w-4 h-4" />
                {t("marketplace.postListing")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InquiryModal({
  listing,
  t,
  onClose,
}: {
  listing: Listing;
  t: (key: string) => string;
  onClose: () => void;
}) {
  const sendInquiry = useSendInquiry();
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendInquiry.mutateAsync({
      listingId: listing.id,
      message,
      phone: phone || undefined,
    });
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-kisan-border dark:border-gray-700">
          <h2 className="text-lg font-bold text-kisan-text dark:text-gray-100">
            {t("marketplace.message")}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-kisan-text-secondary" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Send className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-semibold text-kisan-text dark:text-gray-100">
              Inquiry Sent!
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90"
            >
              {t("common.continue")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-4 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
              <p className="text-sm font-medium text-kisan-text dark:text-gray-100">
                {listing.cropName}
              </p>
              <p className="text-xs text-kisan-text-secondary">
                {listing.quantity} {listing.unit} by {listing.postedBy}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                {t("marketplace.message")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                placeholder={`Hi, I'm interested in your ${listing.cropName} listing...`}
                className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
                {t("marketplace.phone")}{" "}
                <span className="text-kisan-text-light font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-kisan-text-light" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!message.trim() || sendInquiry.isPending}
              className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sendInquiry.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <Send className="w-4 h-4" />
              {t("marketplace.message")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
