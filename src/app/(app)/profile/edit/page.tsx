"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateNickname, updateProfileImage, deleteProfileImage, getUserProfile } from "@/lib/api/users";
import { uploadMedia } from "@/lib/api/posts";

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const userId = session?.user?.id != null ? String(session.user.id) : undefined;
  const userIdNum = session?.user?.id != null ? Number(session.user.id) : null;

  const [nickname, setNickname] = useState("");
  const [originalNickname, setOriginalNickname] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageDeleted, setImageDeleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userIdNum || !userId) return;
    getUserProfile(userIdNum).then((profile) => {
      setNickname(profile.nickname);
      setOriginalNickname(profile.nickname);
      setPreviewImage(profile.profileImageUrl);
      setOriginalImage(profile.profileImageUrl);
    }).catch(() => {
      const name = session?.user?.name ?? "";
      const image = session?.user?.image ?? null;
      setNickname(name);
      setOriginalNickname(name);
      setPreviewImage(image);
      setOriginalImage(image);
    });
  }, [userIdNum, userId]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewImage(URL.createObjectURL(file));
    setImageDeleted(false);
  }

  function handleImageDelete() {
    setSelectedFile(null);
    setPreviewImage(null);
    setImageDeleted(true);
  }

  const nicknameChanged = nickname.trim() !== originalNickname;
  const imageChanged = selectedFile !== null || (imageDeleted && originalImage !== null);
  const hasChanges = nicknameChanged || imageChanged;

  async function handleSave() {
    if (!userId || saving) return;
    setSaving(true);
    try {
      const tasks: Promise<unknown>[] = [];

      if (nicknameChanged && nickname.trim()) {
        tasks.push(
          updateNickname(nickname.trim()).then(() =>
            update({ name: nickname.trim() })
          )
        );
      }

      if (selectedFile) {
        tasks.push(
          uploadMedia([selectedFile]).then((uploaded) =>
            updateProfileImage(uploaded[0].url).then(() =>
              update({ image: uploaded[0].url })
            )
          )
        );
      } else if (imageDeleted && originalImage !== null) {
        tasks.push(
          deleteProfileImage().then(() => update({ image: null }))
        );
      }

      await Promise.all(tasks);

      if (nicknameChanged) setOriginalNickname(nickname.trim());
      if (imageChanged) {
        setOriginalImage(imageDeleted ? null : previewImage);
        setSelectedFile(null);
        setImageDeleted(false);
      }

      toast.success("프로필이 저장되었어요.");
    } catch {
      toast.error("저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-black/5 px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="grid size-8 place-items-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center text-base font-semibold">프로필 편집</h1>
        <div className="size-8" />
      </header>

      <div className="flex flex-1 flex-col gap-8 px-5 pt-8">
        {/* 프로필 사진 */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="size-24 overflow-hidden rounded-full bg-zinc-200 ring-2 ring-zinc-200">
              {previewImage ? (
                <img src={previewImage} alt="프로필" referrerPolicy="no-referrer" className="size-full object-cover" />
              ) : (
                <div className="size-full bg-zinc-200" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={saving}
              className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-[#2E7DF2] text-white shadow-md"
            >
              <Camera size={14} />
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {previewImage && (
            <button
              type="button"
              onClick={handleImageDelete}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500"
            >
              <Trash2 size={13} />
              기본 이미지로 변경
            </button>
          )}
        </div>

        {/* 닉네임 */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-zinc-500">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
            className="rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-[#2E7DF2]"
          />
          <p className="text-xs text-zinc-400">최대 10자</p>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="px-5 pb-8 pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full rounded-xl bg-[#2E7DF2] py-3.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </div>
  );
}
