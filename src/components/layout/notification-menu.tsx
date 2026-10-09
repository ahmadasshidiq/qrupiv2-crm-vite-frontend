import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ApiError } from "@/lib/api/client";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from "@/lib/api/notifications";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function sanitizeNotificationHtml(value: string) {
  if (!value.includes("<")) return value;
  const documentParser = new DOMParser();
  const parsed = documentParser.parseFromString(value, "text/html");
  parsed.querySelectorAll("script, style, iframe, object, embed, form").forEach((node) => node.remove());
  parsed.querySelectorAll("*").forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      if (attribute.name.toLowerCase().startsWith("on")) {
        element.removeAttribute(attribute.name);
      }
    });
    for (const attributeName of ["href", "src"]) {
      const attribute = element.getAttribute(attributeName);
      if (attribute && /^(javascript|data|vbscript):/i.test(attribute.trim())) {
        element.removeAttribute(attributeName);
      }
    }
  });
  return parsed.body.innerHTML;
}

export function NotificationMenu() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationDto | null>(null);

  useEffect(() => {
    void fetchUnreadNotificationCount()
      .then(setCount)
      .catch(() => undefined);
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      setItems(await fetchNotifications());
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Notifikasi gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) void loadNotifications();
  }

  async function handleRead(item: NotificationDto) {
    if (!item.read_at) {
      await markNotificationRead(item.id).catch(() => undefined);
      setItems((current) =>
        current.map((notification) =>
          notification.id === item.id
            ? { ...notification, read_at: new Date().toISOString() }
            : notification,
        ),
      );
      setCount((current) => Math.max(0, current - 1));
    }
    setOpen(false);
    setSelectedNotification({
      ...item,
      read_at: item.read_at ?? new Date().toISOString(),
    });
  }

  async function handleReadAll() {
    if (count === 0) return;
    await markAllNotificationsRead();
    setCount(0);
    setItems((current) =>
      current.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      })),
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className="group/button relative inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-transparent text-xs shadow-xs transition-all outline-none hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-ring/30 dark:border-white/10 dark:hover:bg-white/10 [&_svg]:size-4"
        aria-label="Notifikasi"
      >
        <Bell />
        {count > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] leading-5 font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(92vw,380px)] p-0 mt-7">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Notifikasi</h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={count === 0}
            onClick={() => void handleReadAll()}
          >
            <CheckCheck className="mr-1 size-4" /> Tandai semua
          </Button>
        </div>
        <div className="max-h-[min(70vh,440px)] space-y-2 overflow-y-auto p-2">
          {loading ? (
            <p className="p-4 text-sm text-zinc-500">Memuat notifikasi...</p>
          ) : null}
          {!loading && items.length === 0 ? (
            <p className="p-4 text-sm text-zinc-500 text-center">Tidak ada notifikasi.</p>
          ) : null}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void handleRead(item)}
              className={`flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-zinc-100 dark:hover:bg-white/10 ${item.read_at ? "" : "bg-blue-50 dark:bg-blue-950/30"}`}
            >
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${item.read_at ? "bg-zinc-300" : "bg-blue-500"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {item.title}
                </span>
                <span
                  className="legal-content mt-0.5 block line-clamp-3 text-xs text-zinc-600 dark:text-zinc-300"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeNotificationHtml(item.message),
                  }}
                >
                </span>
                <span className="mt-1 block text-[10px] text-zinc-400">
                  {formatNotificationDate(item.created_at)}
                </span>
              </span>
              {item.deeplink || item.web_url ? (
                <ExternalLink className="mt-1 size-4 shrink-0 text-zinc-400" />
              ) : null}
            </button>
          ))}
        </div>
      </PopoverContent>
      </Popover>
      <Dialog
      open={Boolean(selectedNotification)}
      onOpenChange={(value) => !value && setSelectedNotification(null)}
    >
      <DialogContent
        className="w-[calc(100%_-_2rem)] max-w-lg rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-900"
        overlayClassName="bg-black/50 backdrop-blur-sm"
      >
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg font-semibold leading-7">
            {selectedNotification?.title}
          </DialogTitle>
          <DialogDescription>
            {selectedNotification?.created_at
              ? formatNotificationDate(selectedNotification.created_at)
              : ""}
          </DialogDescription>
        </DialogHeader>
        {selectedNotification?.message ? (
          <div
            className="legal-content max-h-[60vh] overflow-y-auto rounded-xl bg-zinc-50 px-4 py-3 text-sm leading-7 text-zinc-700 dark:bg-white/5 dark:text-zinc-300"
            dangerouslySetInnerHTML={{
              __html: sanitizeNotificationHtml(selectedNotification.message),
            }}
          />
        ) : (
          <p className="text-sm text-zinc-500">Tidak ada isi pesan.</p>
        )}
      </DialogContent>
      </Dialog>
    </>
  );
}
