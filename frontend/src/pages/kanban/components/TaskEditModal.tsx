import { Button, Form, Input, Modal, Popconfirm } from "antd";
import { useEffect } from "react";
import type { Task, UpdateTaskRequest } from "shared";

type TaskEditModalProps = {
	task: Task | null;
	open: boolean;
	onCancel: () => void;
	onUpdate: (values: UpdateTaskRequest) => void;
	onDelete: () => void;
	isUpdateLoading: boolean;
	isDeleteLoading: boolean;
};

export function TaskEditModal({
	task,
	open,
	onCancel,
	onUpdate,
	onDelete,
	isUpdateLoading,
	isDeleteLoading,
}: TaskEditModalProps) {
	const [form] = Form.useForm<UpdateTaskRequest>();

	useEffect(() => {
		if (task && open) {
			form.setFieldsValue({
				title: task.title,
				description: task.description,
			});
		}
	}, [task, open, form]);

	const handleOk = () => {
		form.validateFields().then((values) => {
			onUpdate(values);
		});
	};

	const handleClose = () => {
		form.resetFields();
		onCancel();
	};

	return (
		<Modal
			title="タスクを編集"
			open={open}
			onOk={handleOk}
			onCancel={handleClose}
			confirmLoading={isUpdateLoading}
			destroyOnClose
			footer={[
				<Popconfirm
					key="delete"
					title="このタスクを削除しますか？"
					onConfirm={onDelete}
					okText="削除"
					cancelText="キャンセル"
				>
					<Button danger loading={isDeleteLoading}>
						削除
					</Button>
				</Popconfirm>,
				<Button key="cancel" onClick={handleClose}>
					キャンセル
				</Button>,
				<Button
					key="save"
					type="primary"
					onClick={handleOk}
					loading={isUpdateLoading}
				>
					保存
				</Button>,
			]}
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
