"use client";

import { Modal } from "@/components/ui/Modal";

export default function AuthHelpModal({ open, onClose }: { open: boolean; onClose: () => void; }) {
    return (
        <Modal open={open} onClose={onClose}>
            <h2 className="text-xl font-bold">Configurar domínios autorizados</h2>
            <p className="mt-3">1. No Firebase Console: Authentication → Sign-in method → Authorized domains.</p>
            <ul className="list-disc ml-5">
                <li>localhost</li>
                <li>127.0.0.1</li>
                <li>&lt;seu-app&gt;.vercel.app</li>
                <li>...etc</li>
            </ul>
            <p className="mt-3">2. Se o erro for `auth/unauthorized-domain`, adicione o domínio e recarregue.</p>
            <p className="mt-3">3. Para testes locais, use `npm run dev` e abra `http://localhost:3000`.</p>
        </Modal>
    );
}
