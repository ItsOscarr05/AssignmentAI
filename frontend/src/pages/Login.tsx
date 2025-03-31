import { Button as UiButton } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Fade,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  styled,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import AppIcon from "../components/AppIcon";
import {
  StyledContainer,
  StyledSubtitle,
  StyledTitle,
} from "../components/styled";
import { useAuth } from "../contexts/AuthContext";

// Define animated components
const AnimatedBox = styled(Box)(({ theme }) => ({
  animation: `fadeInUp 0.8s ease-out`,
  "@keyframes fadeInUp": {
    from: {
      opacity: 0,
      transform: "translateY(20px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
}));

const FloatingBox = styled(Box)(({ theme }) => ({
  position: "absolute",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.1)",
  animation: `float 6s ease-in-out infinite`,
  "@keyframes float": {
    "0%": {
      transform: "translateY(0px)",
    },
    "50%": {
      transform: "translateY(-20px)",
    },
    "100%": {
      transform: "translateY(0px)",
    },
  },
}));

const SlidingBox = styled(Box)(({ theme }) => ({
  animation: `slideIn 1s ease-out`,
  "@keyframes slideIn": {
    from: {
      opacity: 0,
      transform: "translateX(-100px)",
    },
    to: {
      opacity: 1,
      transform: "translateX(0)",
    },
  },
}));

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoggingIn, loginError } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data);
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <StyledContainer>
      <Grid container sx={{ height: "100vh" }}>
        {/* Left side - Illustration */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <SlidingBox
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Animated shapes */}
            <FloatingBox
              sx={{
                width: "300px",
                height: "300px",
                top: "20%",
                left: "20%",
                animation: "float 6s ease-in-out infinite",
              }}
            />
            <FloatingBox
              sx={{
                width: "200px",
                height: "200px",
                bottom: "20%",
                right: "20%",
                animation: "float 8s ease-in-out infinite",
              }}
            />
            <FloatingBox
              sx={{
                width: "150px",
                height: "150px",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                animation: "float 7s ease-in-out infinite",
              }}
            />
            <AppIcon size={120} />
            <Typography
              variant="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                textAlign: "center",
                zIndex: 1,
                animation: "fadeInUp 1s ease-out",
                mt: 4,
              }}
            >
              Welcome Back!
            </Typography>
          </SlidingBox>
        </Grid>

        {/* Right side - Login Form */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
            background: "white",
          }}
        >
          <Fade in timeout={800}>
            <AnimatedBox
              sx={{
                width: "100%",
                maxWidth: 400,
              }}
            >
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Avatar
                  sx={{
                    m: "0 auto",
                    bgcolor: "primary.main",
                    boxShadow: "0 0 20px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  <LockOutlined />
                </Avatar>
                <StyledTitle
                  component="h1"
                  variant="h5"
                  sx={{
                    mt: 2,
                    animation: "fadeInUp 0.8s ease-out 0.2s both",
                  }}
                >
                  Sign in
                </StyledTitle>
                <StyledSubtitle
                  variant="body2"
                  sx={{
                    animation: "fadeInUp 0.8s ease-out 0.4s both",
                  }}
                >
                  Welcome back! Please enter your details.
                </StyledSubtitle>
              </Box>

              <form
                className="mt-8 space-y-6"
                onSubmit={handleSubmit(onSubmit)}
              >
                <div className="rounded-md shadow-sm space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    required
                    error={errors.email?.message}
                    {...register("email")}
                  />
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    error={errors.password?.message}
                    {...register("password")}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{
                              color: "primary.main",
                              "&:hover": {
                                backgroundColor: "rgba(220, 38, 38, 0.04)",
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>

                {(error || loginError) && (
                  <div className="text-sm text-red-600">
                    {error || "An error occurred during login"}
                  </div>
                )}

                <FormControlLabel
                  control={
                    <Checkbox
                      value="remember"
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />
                  }
                  label="Remember me"
                />
                <div>
                  <UiButton
                    type="submit"
                    className="w-full"
                    isLoading={isLoggingIn}
                  >
                    Sign in
                  </UiButton>
                </div>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="text"
                      onClick={() => navigate("/forgot-password")}
                      sx={{
                        color: "primary.main",
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(220, 38, 38, 0.04)",
                          transform: "translateX(5px)",
                        },
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="text"
                      onClick={() => navigate("/register")}
                      sx={{
                        color: "primary.main",
                        textTransform: "none",
                        fontWeight: 500,
                        fontSize: "0.875rem",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          backgroundColor: "rgba(220, 38, 38, 0.04)",
                          transform: "translateX(5px)",
                        },
                      }}
                    >
                      Don't have an account? Sign Up
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </AnimatedBox>
          </Fade>
        </Grid>
      </Grid>
    </StyledContainer>
  );
}
