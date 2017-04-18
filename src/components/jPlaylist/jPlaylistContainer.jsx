import React from 'react';
import merge from 'lodash.merge';
import classNames from 'classnames';
import { formats, actions as jPlayerActions } from 'react-jplayer';
import { Motion, spring } from 'react-motion';
import { connectWithId, classes as sharedClasses } from 'react-jplayer-utils';
import PropTypes from 'prop-types';

import JPlaylist from './jPlaylist';
import PlaylistItem from '../playlistItem/playlistItemContainer';
import classes from '../../util/classes';
import { setOption, select, play, pause, shuffle, setPlaylist } from '../../actions/actions';

const mapStateToProps = ({ jPlaylists }, { id, children, ...attributes }) => ({
  shuffleAnimationConfig: jPlaylists[id].shuffleAnimationConfig,
  play: jPlaylists[id].play,
  playNow: jPlaylists[id].playNow,
  autoBlur: jPlaylists[id].autoBlur,
  paused: jPlaylists[id].paused,
  shuffled: jPlaylists[id].shuffled,
  loop: jPlaylists[id].loop,
  shuffleOnLoop: jPlaylists[id].shuffleOnLoop,
  loopOnPrevious: jPlaylists[id].loopOnPrevious,
  autoPlay: jPlaylists[id].autoPlay,
  current: jPlaylists[id].current,
  playlist: jPlaylists[id].playlist,
  keyBindings: jPlaylists[id].keyBindings,
  itemClass: jPlaylists[id].itemClass,
  freeItemClass: jPlaylists[id].freeItemClass,
  removeItemClass: jPlaylists[id].removeItemClass,
  freeGroupClass: jPlaylists[id].freeGroupClass,
  otherJPlaylists: Object.keys(jPlaylists).filter(key => jPlaylists[key].id !== id),
  id,
  children,
  attributes: {
    ...attributes,
    className: classNames(attributes.className, classes.PLAYLIST, {
      [sharedClasses.HIDDEN]: jPlaylists[id].hidePlaylist,
    }),
  },
});

class JPlaylistContainer extends React.Component {
  static get defaultProps() {
    return {
      minHeight: 0,
      maxHeight: 1,
      attributes: null,
      children: null,
    };
  }
  static get propTypes() {
    return {
      dispatch: PropTypes.func.isRequired,
      id: PropTypes.number.isRequired,
      attributes: PropTypes.object,
      shuffled: PropTypes.bool.isRequired,
      children: PropTypes.element,
      minHeight: PropTypes.number,
      maxHeight: PropTypes.number,
      shuffleAnimationConfig: PropTypes.object.isRequired,
      play: PropTypes.bool.isRequired,
      playNow: PropTypes.bool.isRequired,
      autoBlur: PropTypes.bool.isRequired,
      paused: PropTypes.bool.isRequired,
      loop: PropTypes.string.isRequired,
      shuffleOnLoop: PropTypes.bool.isRequired,
      loopOnPrevious: PropTypes.bool.isRequired,
      autoPlay: PropTypes.bool.isRequired,
      otherJPlaylists: PropTypes.arrayOf(
        PropTypes.object,
      ).isRequired,
      current: PropTypes.number.isRequired,
      playlist: PropTypes.arrayOf(
          PropTypes.shape({
            title: PropTypes.string,
            artist: PropTypes.string,
            mp3: PropTypes.string,
            poster: PropTypes.string,
            free: PropTypes.bool,
          }),
      ).isRequired,
      keyBindings: PropTypes.object.isRequired,
      itemClass: PropTypes.string.isRequired,
      freeItemClass: PropTypes.string.isRequired,
      removeItemClass: PropTypes.string.isRequired,
      freeGroupClass: PropTypes.string.isRequired,
    };
  }
  constructor(props, context) {
    super(props, context);

    this.state = {};
    // this.playlistContainerMinHeight = this.playlistItemAnimMinHeight = 0;
    // this.playlistContainerMaxHeight = this.playlistItemAnimMaxHeight = 1;

    this.freeMediaLinkIndex = 0;

    // Put the title in its initial display state
    // if (!this.props.fullScreen) {
    //   this.setState(state => addUniqueToArray(state.detailsClass, constants.classes.HIDDEN));
    // }
  }
  componentWillMount() {
    const playlist = this.getPlaylistShufflePositions();
    this.props.dispatch(setPlaylist(this.props.id, playlist));
    this.props.dispatch(jPlayerActions.setOption(
      this.props.id, 'keyBindings', merge({
        next: {
          key: 221, // ]
          fn: () => this.next(),
        },
        previous: {
          key: 219, // [
          fn: () => this.previous(),
        },
        shuffle: {
          key: 83, // s
          fn: () => this.shuffle(),
        },
      }, this.props.keyBindings),
    ));

    // this.props.setOption('onResize', () => {
    // const method = this.props.fullScreen ? this.props.removeFromArrayByValue
    // : this.props.addUniqueToArray;

    //   this.setState(state => method(state.detailsClass, constants.classes.HIDDEN));
    //   this._trigger(this.props.onResize);
    // });
  }
  componentDidMount() {
    this.media = document.querySelector(`#${this.props.id} audio`) ||
      document.querySelector(`#${this.props.id} video`);

    this.media.addEventListener('ended', this.playNext);
    this.media.addEventListener('play', this.pauseOthers);
  }
  componentDidUpdate(prevProps) {
    // if (!this.state.shuffling && this.state.shuffling !== prevState.shuffling) {
    //   if (this.props.playNow || !this.props.paused) {
    //     this.props.dispatch(play(this.props.id, 0));
    //   } else {
    //     this.props.dispatch(select(this.props.id, 0));
    //   }
    // }

    // if (this.props.playlist !== prevProps.playlist && !this.state.shuffling) {
    //   this.autoPlay();
    // }

    // if (this.props.index !== prevProps.index) {
    //   if (!this.props.play) {
    //     this.select();
    //   } else {
    //     this.play();
    //   }
    // }

    if (this.props.current !== prevProps.current) {
      this.setCurrentMedia();
    }

    // if (this.props.playlist !== prevProps.playlist) {
    //   if (this.props.playlist.length === 0) {
    //     this.playlistCleared();
    //   }
    // }
    if (this.props.shuffled !== prevProps.shuffled
        && this.props.playlist === prevProps.playlist) {
      this.shuffle();
    }
  }
  componentWillUnmount() {
    this.media.removeEventListener('ended', this.playNext);
    this.media.removeEventListener('play', this.pauseOthers);
  }
  getPlaylistShufflePositions = () => this.props.playlist.map((media, index) => ({
    ...media,
    shufflePosition: index,
  }))
  setCurrentMedia = () => this.props.dispatch(jPlayerActions
    .setMedia(this.props.id, this.props.playlist[this.props.current]));
  playNext = () => this.next()
  pauseOthers = () => {
    this.props.otherJPlaylists.forEach(jPlaylist =>
      this.props.dispatch(pause(jPlaylist.id)));
  }
  // add = (media, playNow) => {
  //   media.key = maxBy(this.props.playlist, 'key').key + 1;

  //   this.props.dispatch(setOption(this.props.id, 'originalPlaylist',
  //     [
  //       ...this.props.originalPlaylist,
  //       media,
  //     ]));
  //   // this.props.addUniqueToArray(constants.keys.PLAYLIST_CLASS, media);

  //   if (playNow) {
  //     this.props.dispatch(play(this.props.id, this.props.playlist.length - 1));
  //   } else if (this.props.originalPlaylist.length === 1) {
  //     this.props.dispatch(select(this.props.id, 0));
  //   }
  // }
  playlistCleared = () => {
    this.initPlaylist();
    this.props.dispatch(jPlayerActions.clearMedia(this.props.id));
  }
  select = () => {
    // if (this.props.current >= 0 && this.props.current < this.props.playlist.length) {
    //   this.props.dispatch(setOption(this.props.id, 'current', this.props.index));
    //   this.props.dispatch(jPlayerActions.setMedia(this.props.playlist[this.props.index]));
    // } else {
    //   this.props.dispatch(setOption(this.props.id, 'current', 0));
    // }
  }
  // play = () => {
  //   if (this.props.index >= 0 && this.props.index < this.props.playlist.length) {
  //     if (this.props.playlist.length) {
  //       this.props.dispatch(select(this.props.id, this.props.index));
  //       this.props.dispatch(jPlayerActions.play(this.props.id));
  //     }
  //   } else if (this.props.index === undefined) {
  //     this.props.dispatch(jPlayerActions.play(this.props.id));
  //   }
  // }
  // autoPlay = () => {
  //   if (this.props.autoPlay) {
  //     this.props.dispatch(play(this.props.id, this.props.current));
  //   } else {
  //     this.props.dispatch(select(this.props.id, this.props.current));
  //   }
  // }
  shuffle = () => {
    if (this.props.shuffled) {
      const shuffledPlaylist = [...this.props.playlist].sort(() => 0.5 - Math.random());

      this.props.dispatch(setPlaylist(this.props.id, shuffledPlaylist));
    } else {
      const originalPlaylist = [...this.props.playlist];
      originalPlaylist.sort((a, b) => a.shufflePosition - b.shufflePosition);
      this.props.dispatch(setPlaylist(this.props.id, originalPlaylist));
    }
  }
  render() {
    return (
      <JPlaylist
        playlist={this.props.playlist} attributes={this.props.attributes}
      >
        {this.props.children}
      </JPlaylist>
    );
  }
}
{/*<Playlist shuffling={this.state.shuffling} config={this.props.shuffleAnimation} onRest={this.shuffleAnimationCallback}>
  <PlaylistItem
    medias={this.props.playlist} current={this.props.current} config={MediaAnimationConfig} onRest={this._removeAnimationCallback}
    removeItemClass={this.props.removeItemClass} freeGroupClass={this.props.freeGroupClass} itemClass={this.props.itemClass} enableRemoveControls={this.props.enableRemoveControls}
    remove={this.remove} blur={this.blur} play={this.play} mergeOptions={this.mergeOptions}
  />
</Playlist>*/}
export default connectWithId(mapStateToProps)(JPlaylistContainer);
