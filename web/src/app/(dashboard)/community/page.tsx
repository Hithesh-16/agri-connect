"use client";

import React, { useState, useMemo } from "react";
import {
  MessagesSquare,
  Plus,
  X,
  HelpCircle,
  Trophy,
  Lightbulb,
  Bug,
  ThumbsUp,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Send,
  ImageIcon,
  Loader2,
  MapPin,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  useCommunityPosts,
  useCommunityPost,
  useCreatePost,
  useAddComment,
  useUpvotePost,
  type CommunityPost,
  type CommunityComment,
  type CreatePostPayload,
} from "@/hooks/useCommunity";

type PostType = CommunityPost["type"];

const POST_TYPE_CONFIG: Record<
  PostType,
  { icon: typeof HelpCircle; color: string; bg: string; labelKey: string }
> = {
  question: {
    icon: HelpCircle,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    labelKey: "community.questions",
  },
  success_story: {
    icon: Trophy,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    labelKey: "community.successStories",
  },
  tip: {
    icon: Lightbulb,
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    labelKey: "community.tips",
  },
  pest_help: {
    icon: Bug,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    labelKey: "community.pestHelp",
  },
};

const POST_TYPE_TABS: { id: "all" | PostType; labelKey: string }[] = [
  { id: "all", labelKey: "marketplace.allCategories" },
  { id: "question", labelKey: "community.questions" },
  { id: "success_story", labelKey: "community.successStories" },
  { id: "tip", labelKey: "community.tips" },
  { id: "pest_help", labelKey: "community.pestHelp" },
];

const ROLE_LABELS: Record<string, { en: string; color: string }> = {
  farmer: { en: "Farmer", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  agricultural_officer: { en: "Agri Officer", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  dealer: { en: "Dealer", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  expert: { en: "Expert", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
};

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  return `${diffWeeks}w ago`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function CommunityPage() {
  const { t, locale } = useI18n();
  const [typeFilter, setTypeFilter] = useState<"all" | PostType>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  const { data: posts, isLoading } = useCommunityPosts(
    typeFilter === "all" ? undefined : typeFilter
  );

  const displayPosts = posts || [];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <MessagesSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-kisan-text dark:text-gray-100">
              {t("community.title")}
            </h1>
            <p className="text-xs text-kisan-text-secondary">
              {locale === "te"
                ? "రైతులతో చర్చించండి & నేర్చుకోండి"
                : locale === "hi"
                ? "किसानों से चर्चा करें और सीखें"
                : "Discuss & learn with fellow farmers"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t("community.newPost")}</span>
        </button>
      </div>

      {/* Post Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
        {POST_TYPE_TABS.map((tab) => {
          const config = tab.id !== "all" ? POST_TYPE_CONFIG[tab.id] : null;
          const TabIcon = config?.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all border whitespace-nowrap shrink-0",
                typeFilter === tab.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-gray-800 text-kisan-text-secondary border-kisan-border dark:border-gray-700 hover:border-primary/40"
              )}
            >
              {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Post Feed */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : displayPosts.length > 0 ? (
        <div className="space-y-4">
          {displayPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              locale={locale}
              t={t}
              isExpanded={expandedPostId === post.id}
              onToggleExpand={() =>
                setExpandedPostId(expandedPostId === post.id ? null : post.id)
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <MessagesSquare className="w-10 h-10 text-indigo-300" />
          </div>
          <p className="text-kisan-text-secondary text-sm font-medium">
            {t("community.noPosts")}
          </p>
          <p className="text-kisan-text-light text-xs mt-1">
            {t("community.startConversation")}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            {t("community.newPost")}
          </button>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          locale={locale}
          t={t}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function PostCard({
  post,
  locale,
  t,
  isExpanded,
  onToggleExpand,
}: {
  post: CommunityPost;
  locale: string;
  t: (key: string) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const typeConfig = POST_TYPE_CONFIG[post.type];
  const TypeIcon = typeConfig.icon;
  const upvoteMutation = useUpvotePost();
  const [localUpvotes, setLocalUpvotes] = useState(post.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const roleInfo = ROLE_LABELS[post.userRole] || ROLE_LABELS.farmer;

  const handleUpvote = () => {
    if (hasUpvoted) return;
    setHasUpvoted(true);
    setLocalUpvotes((prev) => prev + 1);
    upvoteMutation.mutate(post.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-kisan-border dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        {/* User Info + Post Type */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {getInitials(post.userName)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-kisan-text dark:text-gray-100">
                  {post.userName}
                </span>
                <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full", roleInfo.color)}>
                  {roleInfo.en}
                </span>
              </div>
              {post.location && (
                <div className="flex items-center gap-1 text-[10px] text-kisan-text-light mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {post.location}
                </div>
              )}
            </div>
          </div>
          <span className={cn("flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full shrink-0", typeConfig.bg, typeConfig.color)}>
            <TypeIcon className="w-3 h-3" />
            {t(typeConfig.labelKey)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-kisan-text dark:text-gray-100 mb-1.5">{post.title}</h3>

        {/* Content */}
        <p
          className={cn(
            "text-sm text-kisan-text-secondary leading-relaxed",
            !isExpanded && "line-clamp-3"
          )}
        >
          {post.content}
        </p>

        {/* Crop Tag & Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {post.cropName && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800">
              {post.cropName}
            </span>
          )}
          {post.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-kisan-border/50 dark:border-gray-700/50">
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpvote}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-all",
                hasUpvoted
                  ? "text-primary"
                  : "text-kisan-text-light hover:text-primary"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4", hasUpvoted && "fill-primary")} />
              {localUpvotes}
            </button>
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1.5 text-xs font-medium text-kisan-text-light hover:text-primary transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              {post.commentCount} {t("community.comments")}
            </button>
          </div>
          <span className="text-[10px] text-kisan-text-light">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <ExpandedPostView postId={post.id} locale={locale} t={t} />
      )}

      {/* Expand/Collapse toggle */}
      <button
        onClick={onToggleExpand}
        className="w-full py-2 flex items-center justify-center gap-1 text-xs text-kisan-text-light hover:text-primary transition-all border-t border-kisan-border/50 dark:border-gray-700/50"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            {locale === "te" ? "తక్కువ చూపు" : locale === "hi" ? "कम दिखाएँ" : "Show less"}
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            {locale === "te" ? "మరింత చూపు" : locale === "hi" ? "और दिखाएँ" : "Show more"}
          </>
        )}
      </button>
    </div>
  );
}

function ExpandedPostView({
  postId,
  locale,
  t,
}: {
  postId: string;
  locale: string;
  t: (key: string) => string;
}) {
  const { data, isLoading } = useCommunityPost(postId);
  const addCommentMutation = useAddComment(postId);
  const [commentText, setCommentText] = useState("");

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await addCommentMutation.mutateAsync({ content: commentText, images: [] });
    setCommentText("");
  };

  if (isLoading) {
    return (
      <div className="px-4 pb-4 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const comments = data?.comments || [];

  return (
    <div className="px-4 pb-4 space-y-3 border-t border-kisan-border/50 dark:border-gray-700/50 pt-3">
      {/* Comments */}
      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} t={t} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-kisan-text-light text-center py-4">
          {locale === "te"
            ? "ఇంకా వ్యాఖ్యలు లేవు"
            : locale === "hi"
            ? "अभी कोई टिप्पणी नहीं"
            : "No comments yet"}
        </p>
      )}

      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="flex gap-2">
        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={2}
          placeholder={
            locale === "te"
              ? "మీ వ్యాఖ్య రాయండి..."
              : locale === "hi"
              ? "अपनी टिप्पणी लिखें..."
              : "Write your comment..."
          }
          className="flex-1 px-3 py-2 rounded-xl border border-kisan-border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <button
          type="submit"
          disabled={!commentText.trim() || addCommentMutation.isPending}
          className="self-end px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}

function CommentCard({
  comment,
  t,
}: {
  comment: CommunityComment;
  t: (key: string) => string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl p-3",
        comment.isAnswer
          ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
          : "bg-gray-50 dark:bg-gray-700/50"
      )}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
          {getInitials(comment.userName)}
        </div>
        <span className="text-xs font-semibold text-kisan-text dark:text-gray-200">
          {comment.userName}
        </span>
        {comment.isAnswer && (
          <span className="flex items-center gap-0.5 text-[9px] font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            {t("community.answer")}
          </span>
        )}
        <span className="text-[10px] text-kisan-text-light ml-auto">
          {timeAgo(comment.createdAt)}
        </span>
      </div>
      <p className="text-sm text-kisan-text-secondary dark:text-gray-300 leading-relaxed">
        {comment.content}
      </p>
      <div className="flex items-center gap-2 mt-1.5">
        <button className="flex items-center gap-1 text-[10px] text-kisan-text-light hover:text-primary transition-all">
          <ThumbsUp className="w-3 h-3" />
          {comment.upvotes}
        </button>
      </div>
    </div>
  );
}

function CreatePostModal({
  locale,
  t,
  onClose,
}: {
  locale: string;
  t: (key: string) => string;
  onClose: () => void;
}) {
  const createMutation = useCreatePost();
  const [postType, setPostType] = useState<PostType>("question");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [cropName, setCropName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [images, setImages] = useState<File[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 3));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload: CreatePostPayload = {
      type: postType,
      title,
      content,
      cropName: cropName || undefined,
      tags,
      images: [],
    };

    await createMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-kisan-border dark:border-gray-700">
          <h2 className="text-lg font-bold text-kisan-text dark:text-gray-100">
            {t("community.newPost")}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5 text-kisan-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-2">
              {locale === "te" ? "పోస్ట్ రకం" : locale === "hi" ? "पोस्ट प्रकार" : "Post Type"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(POST_TYPE_CONFIG) as PostType[]).map((type) => {
                const config = POST_TYPE_CONFIG[type];
                const Icon = config.icon;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border",
                      postType === type
                        ? `${config.bg} ${config.color} border-transparent`
                        : "bg-white dark:bg-gray-700 text-kisan-text-secondary border-kisan-border dark:border-gray-600"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(config.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              {locale === "te" ? "శీర్షిక" : locale === "hi" ? "शीर्षक" : "Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                locale === "te"
                  ? "మీ ప్రశ్న లేదా విషయం..."
                  : locale === "hi"
                  ? "आपका सवाल या विषय..."
                  : "Your question or topic..."
              }
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              {locale === "te" ? "వివరాలు" : locale === "hi" ? "विवरण" : "Details"}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder={
                locale === "te"
                  ? "వివరంగా వ్రాయండి..."
                  : locale === "hi"
                  ? "विस्तार से लिखें..."
                  : "Write in detail..."
              }
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Crop Name */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              {locale === "te" ? "పంట (ఐచ్ఛికం)" : locale === "hi" ? "फ़सल (वैकल्पिक)" : "Crop (optional)"}
            </label>
            <input
              type="text"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              placeholder={locale === "te" ? "పంట పేరు" : locale === "hi" ? "फ़सल का नाम" : "Crop name"}
              className="w-full px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              {locale === "te" ? "ట్యాగ్‌లు (కామాతో వేరు చేయండి)" : locale === "hi" ? "टैग (कॉमा से अलग करें)" : "Tags (comma separated)"}
            </label>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-kisan-text-light shrink-0" />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. cotton, pesticide, warangal"
                className="flex-1 px-4 py-2.5 rounded-xl border border-kisan-border dark:border-gray-700 bg-white dark:bg-gray-800 text-kisan-text dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-kisan-text dark:text-gray-200 mb-1">
              {locale === "te" ? "చిత్రాలు (గరిష్ఠం 3)" : locale === "hi" ? "तस्वीरें (अधिकतम 3)" : "Images (up to 3)"}
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((file, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-kisan-border dark:border-gray-700">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
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

          {/* Submit */}
          <button
            type="submit"
            disabled={!title.trim() || !content.trim() || createMutation.isPending}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("community.newPost")}
          </button>
        </form>
      </div>
    </div>
  );
}
