/*For time formatting*/
import Moment from 'react-moment';
/*Material*/
import { Box, Grid, Button, Typography, Card, CardContent, CardActions, Menu, IconButton, MenuItem, Slide } from '@mui/material';
import AccessTimeFilled from '@mui/icons-material/AccessTimeFilled';


const Content = (props) => {
    const {item, type} = props;
    const {loading, searchLoading, anchorElNav, menuUsedArray, MoreVert, showEditContent, ellipsisUsedArray} = props.allParams;
    const {setAnchorElNav, setMenuUsedArray, setLoadingBackdrop, setDeleteDialog, setContentID, setEllipsisUsedArray} = props.allParams;

    return (
        <Slide key={item.id} direction="up" in={type==="mainType" ? !loading : !searchLoading}>
            <Card key={item.id} sx={{ bgcolor: 'blue[50]', my: 1, border:type==="mainType" ? "none" : 2 }} >
                <CardContent sx={{ pb: 0, mb: 0 }}>
                    {/*Card Header*/}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Grid container alignItems="center" direction="row">
                            <Grid item sx={{ mr: 2 }}>
                                <IconButton><AccessTimeFilled fontSize="large" color="primary" /></IconButton>
                            </Grid>
                            <Grid item>
                                <Box>
                                    <Typography variant="h5" sx={{ textTransform: "uppercase" }}>{item.contentTitle}</Typography>
                                    <Box sx={{ display: "inline-flex", flexDirection: "row" }}>
                                        <Typography variant="body2"><Moment format="DD-MMM-YYYY (ddd)">{item.contentDate}</Moment></Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                        <Grid><IconButton key={'menuButton' + item.id} aria-label="more" aria-controls={Boolean(anchorElNav) ? 'long-menu' + item.id : undefined} aria-haspopup="true" aria-expanded={Boolean(anchorElNav) ? 'true' : undefined} onClick={(e) => { if (menuUsedArray.indexOf(item.id) < 0) { setMenuUsedArray(menuUsedArray => [...menuUsedArray, item.id]); setAnchorElNav(e.currentTarget); } else { menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); } }}><MoreVert /></IconButton></Grid>
                    </Box>
                    {/*Menu of Edit, Delete of each card*/}
                    <Menu key={'menuItemsDiv' + item.id} id={'long-menu' + item.id} anchorEl={menuUsedArray.indexOf(item.id) < 0 ? null : anchorElNav} open={menuUsedArray.indexOf(item.id) < 0 ? false : Boolean(anchorElNav)} onClose={() => { menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }} >
                        <MenuItem key={'editMenu' + item.id}><Typography onClick={() => { setLoadingBackdrop(true); showEditContent(item.id); menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Edit</Typography></MenuItem>
                        <MenuItem key={'deleteMenu' + item.id}><Typography onClick={() => { setDeleteDialog(true); setContentID(item.id); menuUsedArray.splice(menuUsedArray.indexOf(item.id), 1); setMenuUsedArray(menuUsedArray => [...menuUsedArray, menuUsedArray]); setAnchorElNav(null); }}>Delete</Typography></MenuItem>
                    </Menu>
                    {/*Card Content*/}
                    <br /><Typography className={ellipsisUsedArray.indexOf(item.id) < 0 ? 'ellipsisStyle' : 'noEllipsisStyle'} variant="body1" id={"contentDetailsIDof" + item.id} sx={{ whiteSpace: 'pre-line' }} >{item.contentDetails}</Typography>
                </CardContent>
                <CardActions disableSpacing>
                    {/*See More or See Less Buttons*/}
                    <Button size="small" onClick={() => { if (ellipsisUsedArray.indexOf(item.id) < 0) { setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, item.id]) } else { ellipsisUsedArray.splice(ellipsisUsedArray.indexOf(item.id), 1); setEllipsisUsedArray(ellipsisUsedArray => [...ellipsisUsedArray, ellipsisUsedArray]); } }}>
                        {(ellipsisUsedArray.indexOf(item.id) < 0) ? 'More' : 'Less'}
                    </Button>
                    {/*Number of words*/}
                    <Typography variant="caption">
                        &nbsp;({item.contentDetails.split(" ").length} words)
                    </Typography>
                </CardActions>
            </Card>
        </Slide>
    )
}

export default Content;