import {
  Close as CloseIcon,
  CreditCard as CreditCardIcon,
  CurrencyBitcoin as CurrencyBitcoinIcon,
  DiamondOutlined as DiamondOutlineIcon,
  EmojiEventsOutlined as EmojiEventsOutlineIcon,
  LocalOfferOutlined as LocalOfferOutlineIcon,
  StarOutline as StarOutlineIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Pagination,
  Typography,
} from '@mui/material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import React, { useMemo, useState } from 'react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  created_at: string;
  type: string;
}

interface TransactionsModalProps {
  open: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onTransactionClick: (event: React.MouseEvent<HTMLElement>, transaction: Transaction) => void;
}

const TransactionsModal: React.FC<TransactionsModalProps> = ({
  open,
  onClose,
  transactions,
  onTransactionClick,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Reset to page 1 when modal opens
  React.useEffect(() => {
    if (open) {
      setCurrentPage(1);
    }
  }, [open]);

  const getTransactionType = (desc: string) => {
    if (/purchase/i.test(desc)) return 'Purchase';
    if (/refund/i.test(desc)) return 'Refund';
    if (/subscription/i.test(desc)) return 'Subscription';
    return 'Purchase';
  };

  // Get transaction icon based on type and description
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'token_purchase') {
      return <CurrencyBitcoinIcon />;
    }

    if (transaction.type === 'subscription') {
      // Extract plan name from description
      const planName = transaction.description.replace('Subscription - ', '').toLowerCase();
      switch (planName) {
        case 'free':
          return <LocalOfferOutlineIcon />;
        case 'plus':
          return <StarOutlineIcon />;
        case 'pro':
          return <DiamondOutlineIcon />;
        case 'max':
          return <EmojiEventsOutlineIcon />;
        default:
          return <CreditCardIcon />;
      }
    }

    return <CreditCardIcon />;
  };

  // Get transaction color based on type and description
  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.type === 'token_purchase') {
      return '#4a148c'; // Dark purple for token purchases
    }

    if (transaction.type === 'subscription') {
      // Extract plan name from description
      const planName = transaction.description.replace('Subscription - ', '').toLowerCase();
      switch (planName) {
        case 'free':
          return '#2196f3'; // Blue
        case 'plus':
          return '#4caf50'; // Green
        case 'pro':
          return '#9c27b0'; // Purple
        case 'max':
          return '#ff9800'; // Orange
        default:
          return '#757575'; // Grey
      }
    }

    return '#757575'; // Default grey
  };

  const filteredTransactions = useMemo(
    () => transactions.filter(t => /purchase|subscription/i.test(t.description)),
    [transactions]
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid red',
          maxHeight: '80vh',
          width: { xs: '95vw', sm: '90vw', md: '50vw' },
          maxWidth: { xs: '95vw', sm: '90vw', md: '50vw' },
          backgroundColor: theme =>
            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h6"
            sx={{
              color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
              fontWeight: 'normal',
            }}
          >
            All Transactions
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 2, overflowX: 'hidden', overflowY: 'auto', maxHeight: '60vh' }}>
        <List sx={{ py: 0, width: '100%', overflow: 'hidden' }}>
          {currentTransactions.map((transaction, index) => {
            const type = getTransactionType(transaction.description);
            const transactionIcon = getTransactionIcon(transaction);
            const transactionColor = getTransactionColor(transaction);
            return (
              <React.Fragment key={index}>
                <ListItem
                  button
                  onClick={e => onTransactionClick(e, transaction)}
                  sx={{
                    pl: 0.75,
                    pr: 0.75,
                    py: 1,
                    position: 'relative',
                    borderLeft: 'none',
                    background: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    border: `2px solid ${transactionColor}`,
                    transition: 'all 0.2s ease-in-out',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    '&:hover': {
                      boxShadow: theme =>
                        theme.palette.mode === 'dark'
                          ? '0 4px 12px rgba(255, 255, 255, 0.1)'
                          : '0 2px 8px rgba(211,47,47,0.08)',
                      transform: 'translateY(-1px)',
                    },
                    mb: 1,
                    mx: 0,
                    borderRadius: 2,
                    '::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      borderTopLeftRadius: '4px',
                      borderBottomLeftRadius: '4px',
                      background: transactionColor,
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, maxWidth: 28, flexShrink: 0, pl: 0.5 }}>
                    {React.cloneElement(transactionIcon, {
                      sx: { color: transactionColor, fontSize: 20 },
                    })}
                  </ListItemIcon>

                  {/* Custom layout instead of ListItemText */}
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      flex: '1 1 auto',
                      minWidth: 0,
                      mr: 0.75,
                      overflow: 'hidden',
                      maxWidth: 'calc(100% - 100px)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        lineHeight: 1.2,
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {transaction.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                      <Chip
                        label={type}
                        size="small"
                        sx={{
                          backgroundColor: transactionColor,
                          color: theme =>
                            theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                          fontWeight: 600,
                          fontSize: '0.65rem',
                          height: 18,
                          flexShrink: 0,
                        }}
                      />
                      <Typography
                        component="span"
                        sx={{
                          color: theme =>
                            theme.palette.mode === 'dark' ? 'text.secondary' : 'text.secondary',
                          fontSize: '0.7rem',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDistanceToNow(parseISO(transaction.created_at), {
                          addSuffix: true,
                        })}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={`$${transaction.amount.toFixed(2)}`}
                    size="small"
                    sx={{
                      backgroundColor: 'transparent',
                      color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      minWidth: 'auto',
                      flexShrink: 0,
                      px: 0.5,
                      whiteSpace: 'nowrap',
                    }}
                  />
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                  border: '1px solid red',
                  '&.Mui-selected': {
                    backgroundColor: 'red',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'darkred',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Transaction count info */}
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of{' '}
            {filteredTransactions.length} transactions
          </Typography>
        </Box>

        {/* Close button */}
        <Button onClick={onClose} variant="outlined" sx={{ borderColor: 'red', color: 'red' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionsModal;
