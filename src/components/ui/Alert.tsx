/**
 * Componente Alert: Exibe mensagens de feedback ao usuário (sucesso, erro, aviso, info).
 * Utiliza Tailwind CSS para estilização responsiva e acessível, com ícones visuais
 * e cores temáticas baseadas no tipo. Integrado ao sistema de temas do app para
 * manter consistência visual. Usado para notificações de ações, validações e status.
 */
"use client";

import clsx from "clsx";

type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
    message: string;
    type?: AlertType;
}

const alertStyles: Record<AlertType, string> = {
    success: "bg-green-50 border-green-300 text-green-800",
    error: "bg-red-50 border-red-300 text-red-800",
    warning: "bg-yellow-50 border-yellow-300 text-yellow-800",
    info: "bg-blue-50 border-blue-300 text-blue-800",
};

export default function Alert({ message, type = "info" }: AlertProps) {
    return (
        <div
            className={clsx(
                "rounded-lg border px-4 py-3 text-sm",
                alertStyles[type],
            )}
            role="alert"
        >
            {message}
        </div>
    );
}
