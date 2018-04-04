import React from 'react';
import { Menu, Close, EyeOff, Github, LifeBuoy } from 'imports/ui/components/icons';

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      navOpen: false,
    };

    this.links = [
      {
        href: '#privacy',
        Icon: EyeOff,
      },
      {
        href: '#develop',
        Icon: Github,
      },
      {
        href: '#help',
        Icon: LifeBuoy,
      },
    ];

    this.toggleNav = this.toggleNav.bind(this);
    this.closeNav = this.closeNav.bind(this);
  }

  toggleNav() {
    this.setState({
      ...this.state,
      navOpen: !this.state.navOpen,
    });
  }

  closeNav() {
    this.setState({
      ...this.state,
      navOpen: false,
    });
  }

  render() {
    const { navOpen } = this.state;
    return (
      <nav className={`stretchyNav ${ navOpen ? 'visible' : ''}`}>
        <ul>
          <li className="trigger" onClick={this.toggleNav}>
            <a href="#"> { navOpen ? <Close /> : <Menu/>} </a>
          </li>
          {
            this.links
              .map((link, index) =>
                <li key={index}><a className="navItem" href={link.href}><link.Icon /></a></li>)
          }
        </ul>

        <span aria-hidden="true" className="navbg"></span>
      </nav>
    );
  }
}
export default Navigation;
