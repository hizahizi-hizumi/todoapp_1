import type { ButtonProps } from "antd";
import { Button } from "antd";

interface SampleButtonProps extends ButtonProps {
	label: string;
}

export const SampleButton = ({ label, ...props }: SampleButtonProps) => {
	return <Button {...props}>{label}</Button>;
};
