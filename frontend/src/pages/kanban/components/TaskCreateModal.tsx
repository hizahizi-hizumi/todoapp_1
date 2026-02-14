import { Form, Input, Modal } from "antd";
import type { CreateTaskRequest } from "shared";

type TaskCreateModalProps = {
	open: boolean;
	onCancel: () => void;
	onSubmit: (values: CreateTaskRequest) => void;
	isLoading: boolean;
};

export function TaskCreateModal({
	open,
	onCancel,
	onSubmit,
	isLoading,
}: TaskCreateModalProps) {
	const [form] = Form.useForm<CreateTaskRequest>();

	const handleOk = () => {
		form.validateFields().then((values) => {
			onSubmit(values);
		});
	};

	const handleClose = () => {
		form.resetFields();
		onCancel();
	};

	return (
		<Modal
			title="タスクを作成"
			open={open}
			onOk={handleOk}
			onCancel={handleClose}
			confirmLoading={isLoading}
			destroyOnClose
		>
			<Form form={form} layout="vertical">
				<Form.Item
					name="title"
					label="タイトル"
					rules={[
						{
							required: true,
							whitespace: true,
							message: "タイトルを入力してください",
						},
						{ max: 100, message: "100文字以内で入力してください" },
					]}
				>
					<Input />
				</Form.Item>
				<Form.Item
					name="description"
					label="説明"
					rules={[{ max: 500, message: "500文字以内で入力してください" }]}
				>
					<Input.TextArea rows={4} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
