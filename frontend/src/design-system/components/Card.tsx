import {
  CardActions,
  CardContent,
  CardHeader,
  Card as MuiCard,
  CardProps as MuiCardProps,
} from "@mui/material";
import { styled } from "@mui/material/styles";

type CustomCardVariant = "elevated" | "outlined" | "flat";
type MuiCardVariant = "outlined" | "elevation";

interface StyledCardProps extends Omit<MuiCardProps, "variant"> {
  customVariant?: CustomCardVariant;
}

const StyledCard = styled(MuiCard)<StyledCardProps>(
  ({ theme, customVariant = "elevated" }) => ({
    ...(customVariant === "elevated" && {
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 8px 12px rgba(0, 0, 0, 0.15)",
      },
    }),
    ...(customVariant === "outlined" && {
      border: `1px solid ${theme.palette.divider}`,
      boxShadow: "none",
    }),
    ...(customVariant === "flat" && {
      backgroundColor: theme.palette.background.paper,
      boxShadow: "none",
      border: `1px solid ${theme.palette.divider}`,
    }),
  })
);

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: theme.spacing(2),
  "& .MuiCardHeader-title": {
    fontSize: "1.25rem",
    fontWeight: 500,
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: theme.spacing(2),
  gap: theme.spacing(1),
}));

export interface CardProps extends Omit<MuiCardProps, "variant"> {
  variant?: CustomCardVariant;
}

export const Card = ({ variant = "elevated", ...props }: CardProps) => {
  // Map our custom variants to MUI variants
  const muiVariant: MuiCardVariant =
    variant === "outlined" ? "outlined" : "elevation";
  return <StyledCard customVariant={variant} variant={muiVariant} {...props} />;
};

export {
  StyledCardActions as CardActions,
  StyledCardContent as CardContent,
  StyledCardHeader as CardHeader,
};
