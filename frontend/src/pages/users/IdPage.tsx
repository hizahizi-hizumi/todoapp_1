import { Link, useNavigate } from "@tanstack/react-router";
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Flex,
	Form,
	Input,
	Modal,
	message,
	Spin,
	Typography,
} from "antd";
import { useState } from "react";

import { useDeleteUser } from "./services/useDeleteUser";
import { useUpdateUser } from "./services/useUpdateUser";
import { useUser } from "./services/useUser";

const { Title } = Typography;

type IdPageProps = {
	id: string;
};

export function IdPage({ id }: IdPageProps) {
	const navigate = useNavigate();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [form] = Form.useForm();

	const { user, isLoading, error } = useUser(id);
	const updateUser = useUpdateUser();
	const deleteUser = useDeleteUser();

	const handleUpdate = () => {
		form.validateFields().then((values) => {
			updateUser.mutate(
				{ id, data: values },
				{
					onSuccess: () => {
						setIsEditModalOpen(false);
						message.success("User updated successfully");
					},
				},
			);
		});
	};

	const handleDelete = () => {
		Modal.confirm({
			title: "Are you sure you want to delete this user?",
			content: "This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			onOk: () => {
				deleteUser.mutate(id, {
					onSuccess: () => {
						message.success("User deleted successfully");
						navigate({ to: "/" });
					},
				});
			},
		});
	};

	const handleEdit = () => {
		if (user) {
			form.setFieldsValue({
				name: user.name,
				email: user.email,
			});
			setIsEditModalOpen(true);
		}
	};

	if (isLoading) {
		return (
			<Flex vertical align="center" gap="middle" style={{ padding: "2rem" }}>
				<Spin size="large" tip="Loading user..." />
			</Flex>
		);
	}

	if (error || !user) {
		return (
			<Flex vertical align="center" gap="middle" style={{ padding: "2rem" }}>
				<Alert
					message="Error"
					description={error?.message || "User not found"}
					type="error"
					showIcon
				/>
				<Link to="/">
					<Button type="primary">Back to Home</Button>
				</Link>
			</Flex>
		);
	}

	return (
		<Flex vertical align="center" gap="middle" style={{ padding: "2rem" }}>
			<Title level={2}>User Detail</Title>
			<Card style={{ width: "100%", maxWidth: 600 }}>
				<Descriptions bordered column={1}>
					<Descriptions.Item label="ID">{user.id}</Descriptions.Item>
					<Descriptions.Item label="Name">{user.name}</Descriptions.Item>
					<Descriptions.Item label="Email">{user.email}</Descriptions.Item>
				</Descriptions>
				<Flex gap="middle" style={{ marginTop: "1rem" }}>
					<Button type="primary" onClick={handleEdit}>
						Edit
					</Button>
					<Button danger onClick={handleDelete} loading={deleteUser.isPending}>
						Delete
					</Button>
				</Flex>
			</Card>

			<Flex gap="middle">
				<Link to="/">
					<Button>Home</Button>
				</Link>
				<Link to="/about">
					<Button>About</Button>
				</Link>
			</Flex>

			<Modal
				title="Edit User"
				open={isEditModalOpen}
				onOk={handleUpdate}
				onCancel={() => {
					setIsEditModalOpen(false);
					form.resetFields();
				}}
				confirmLoading={updateUser.isPending}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						name="name"
						label="Name"
						rules={[{ required: true, message: "Please input the name!" }]}
					>
						<Input />
					</Form.Item>
					<Form.Item
						name="email"
						label="Email"
						rules={[
							{ required: true, message: "Please input the email!" },
							{ type: "email", message: "Please input a valid email!" },
						]}
					>
						<Input />
					</Form.Item>
				</Form>
				{updateUser.isError && (
					<Alert
						message="Error"
						description={updateUser.error?.message || "Failed to update user"}
						type="error"
						showIcon
					/>
				)}
			</Modal>
		</Flex>
	);
}
