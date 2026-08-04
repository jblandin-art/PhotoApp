
import React from 'react';
import { withRouter, Redirect } from 'react-router-dom';
import { Button, TextField, Typography, Paper, Grid, Tabs, Tab, Box } from '@mui/material';
import axios from 'axios';


class LoginRegister extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			// Tab control: 0 = Login, 1 = Register
			activeTab: 0,

			// Login fields
			login_name: '',
			password: '',
			loginError: '',
			redirect: false,

			// Registration fields
			reg_first_name: '',
			reg_last_name: '',
			reg_login_name: '',
			reg_password: '',
			reg_confirm_password: '',
			regError: '',
			regSuccess: '',
		};
	}

	handleTabChange = (event, newValue) => {
		this.setState({ activeTab: newValue, loginError: '', regError: '', regSuccess: '' });
	};

	// ---------- Login Handlers ----------

	handleLoginChange = (field) => (event) => {
		this.setState({ [field]: event.target.value, loginError: '' });
	};

	handleLoginSubmit = (event) => {
		event.preventDefault();
		const { login_name, password } = this.state;
		if (!login_name) {
			this.setState({ loginError: 'Login name is required' });
			return;
		}
		if (!password) {
			this.setState({ loginError: 'Password is required' });
			return;
		}
		axios.post('/admin/login', { login_name, password })
			.then((response) => {
				if (this.props.onLogin) {
					this.props.onLogin(response.data);
				}
				this.setState({ redirect: true });
			})
			.catch((err) => {
				let msg = 'Login failed';
				if (err.response && err.response.data) {
					msg = err.response.data;
				}
				this.setState({ loginError: msg });
			});
	};

	// ---------- Registration Handlers ----------

	handleRegChange = (field) => (event) => {
		this.setState({ [field]: event.target.value, regError: '', regSuccess: '' });
	};

	handleRegSubmit = (event) => {
		event.preventDefault();
		const { reg_first_name, reg_last_name, reg_login_name, reg_password, reg_confirm_password } = this.state;

		// Client-side validation
		if (!reg_first_name) {
			this.setState({ regError: 'First name is required' });
			return;
		}
		if (!reg_last_name) {
			this.setState({ regError: 'Last name is required' });
			return;
		}
		if (!reg_login_name) {
			this.setState({ regError: 'Login name is required' });
			return;
		}
		if (!reg_password) {
			this.setState({ regError: 'Password is required' });
			return;
		}
		if (reg_password !== reg_confirm_password) {
			this.setState({ regError: 'Passwords do not match' });
			return;
		}

		axios.post('/user', {
			login_name: reg_login_name,
			password: reg_password,
			first_name: reg_first_name,
			last_name: reg_last_name,
		})
			.then(() => {
				// Clear form on success
				this.setState({
					reg_first_name: '',
					reg_last_name: '',
					reg_login_name: '',
					reg_password: '',
					reg_confirm_password: '',
					regError: '',
					regSuccess: 'Account created! You can now log in.',
				});
			})
			.catch((err) => {
				let msg = 'Registration failed';
				if (err.response && err.response.data) {
					msg = err.response.data;
				}
				this.setState({ regError: msg });
			});
	};

	render() {
		if (this.props.isLoggedIn || this.state.redirect) {
			return <Redirect to="/users" />;
		}

		const { activeTab } = this.state;

		return (
			<Grid container justifyContent="center" alignItems="center" style={{ minHeight: '80vh' }}>
				<Grid item xs={10} sm={7} md={5}>
					<Paper style={{ padding: 24 }}>

						{/* Tab Switcher */}
						<Tabs value={activeTab} onChange={this.handleTabChange} variant="fullWidth" style={{ marginBottom: 16 }}>
							<Tab label="Login" id="tab-login" />
							<Tab label="Register" id="tab-register" />
						</Tabs>

						{/* ---- Login Form ---- */}
						{activeTab === 0 && (
							<Box>
								<Typography variant="h5" gutterBottom>Welcome Back</Typography>
								<form onSubmit={this.handleLoginSubmit}>
									<TextField
										id="login-login-name"
										label="Login Name"
										value={this.state.login_name}
										onChange={this.handleLoginChange('login_name')}
										fullWidth
										margin="normal"
										autoFocus
									/>
									<TextField
										id="login-password"
										label="Password"
										type="password"
										value={this.state.password}
										onChange={this.handleLoginChange('password')}
										fullWidth
										margin="normal"
									/>
									{this.state.loginError && (
										<Typography color="error" variant="body2" style={{ marginTop: 8 }}>
											{this.state.loginError}
										</Typography>
									)}
									<Button id="login-submit-btn" type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: 16 }}>
										Log In
									</Button>
								</form>
							</Box>
						)}

						{/* ---- Registration Form ---- */}
						{activeTab === 1 && (
							<Box>
								<Typography variant="h5" gutterBottom>Create Account</Typography>
								<form onSubmit={this.handleRegSubmit}>
									<TextField
										id="reg-first-name"
										label="First Name"
										value={this.state.reg_first_name}
										onChange={this.handleRegChange('reg_first_name')}
										fullWidth
										margin="normal"
										autoFocus
									/>
									<TextField
										id="reg-last-name"
										label="Last Name"
										value={this.state.reg_last_name}
										onChange={this.handleRegChange('reg_last_name')}
										fullWidth
										margin="normal"
									/>
									<TextField
										id="reg-login-name"
										label="Login Name"
										value={this.state.reg_login_name}
										onChange={this.handleRegChange('reg_login_name')}
										fullWidth
										margin="normal"
									/>
									<TextField
										id="reg-password"
										label="Password"
										type="password"
										value={this.state.reg_password}
										onChange={this.handleRegChange('reg_password')}
										fullWidth
										margin="normal"
									/>
									<TextField
										id="reg-confirm-password"
										label="Confirm Password"
										type="password"
										value={this.state.reg_confirm_password}
										onChange={this.handleRegChange('reg_confirm_password')}
										fullWidth
										margin="normal"
									/>
									{this.state.regError && (
										<Typography color="error" variant="body2" style={{ marginTop: 8 }}>
											{this.state.regError}
										</Typography>
									)}
									{this.state.regSuccess && (
										<Typography color="primary" variant="body2" style={{ marginTop: 8 }}>
											{this.state.regSuccess}
										</Typography>
									)}
									<Button id="reg-submit-btn" type="submit" variant="contained" color="primary" fullWidth style={{ marginTop: 16 }}>
										Register Me
									</Button>
								</form>
							</Box>
						)}

					</Paper>
				</Grid>
			</Grid>
		);
	}
}

export default withRouter(LoginRegister);
