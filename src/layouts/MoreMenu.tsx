import { DotsHorizontalIcon } from '@heroicons/react/solid';
import { Trans } from '@lingui/macro';
import { useLingui } from '@lingui/react';
import { Button, ListItemIcon, ListItemText, SvgIcon, Typography } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React from 'react';
import { useWeb3Context } from 'src/libs/hooks/useWeb3Context';
import { useRootStore } from 'src/store/root';
import { NAV_BAR } from 'src/utils/events';

import { Link } from '../components/primitives/Link';
import { moreNavigation } from '../ui-config/menu-items';

export function MoreMenu() {
  const { i18n } = useLingui();
  const { currentAccount: walletAddress } = useWeb3Context();
  const trackEvent = useRootStore((store) => store.trackEvent);

  const [anchorEl, setAnchorEl] = React.useState<Element | null>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    setAnchorEl(event.currentTarget);
    trackEvent(NAV_BAR.MORE);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        aria-label="more"
        id="more-button"
        aria-controls={open ? 'more-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
        sx={{
          color: '#F1F1F3',
          minWidth: 'unset',
          p: '6px 8px',
          '&:hover': {
            bgcolor: 'rgba(250, 251, 252, 0.08)',
          },
        }}
      >
        <Trans>More</Trans>
        <SvgIcon color="inherit" sx={{ ml: 1 }}>
          <DotsHorizontalIcon />
        </SvgIcon>
      </Button>

      <Menu
        id="more-menu"
        MenuListProps={{
          'aria-labelledby': 'more-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        keepMounted={true}
      >
        <MenuItem divider={true} component={Link} onClick={handleClose} href="/v3-migration">
          <Typography variant="subheader1">
            <Trans>Migrate to Aave V3</Trans>
          </Typography>
        </MenuItem>
        {moreNavigation.map((item, index) => (
          <MenuItem
            component={Link}
            href={item.makeLink ? item.makeLink(walletAddress) : item.link}
            key={index}
            onClick={() => trackEvent(NAV_BAR.MORE_NAV, { nav_link: item.title })}
          >
            <ListItemIcon>
              <SvgIcon sx={{ fontSize: '20px' }}>{item.icon}</SvgIcon>
            </ListItemIcon>
            <ListItemText>{i18n._(item.title)}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
