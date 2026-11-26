import { QrCode } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserQrCard } from "@/pages/users/components/user-qr-card";

type UserQrPreviewProps = {
  code: string;
  name?: string;
};

export function UserQrPreview({ code, name }: UserQrPreviewProps) {
  return (
    <span className="inline-flex items-center gap-1">
      <Dialog>
        <DialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 -ml-1 text-blue-600"
              title="Lihat QR"
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <QrCode />
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onClick={(event) => event.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>QR {name ?? ""}</DialogTitle>
          </DialogHeader>
          <UserQrCard code={code} name={name} />
        </DialogContent>
      </Dialog>
      <span>{code}</span>
    </span>
  );
}
