import { IconType } from "react-icons";
import { HiListBullet, HiPlus } from "react-icons/hi2";
import { DiGitBranch } from "react-icons/di";
import { Link, NavLink } from "react-router-dom";

import "./MainMenu.css";
import LogoutButton from "./LogoutButton";

type MenuItemProps = {
    Icon: IconType;
    name: string;
    to: string;
};

function MenuItem({ Icon, name, to }: MenuItemProps) {
    return (
        <span className="main-menu__item">
            <NavLink
                to={to}
                className={({ isActive }) => `main-menu__item-link ${isActive ? "main-menu__item-link--active" : ""}`}
            >
                <Icon className="main-menu__item-icon" />
                <span>{name}</span>
            </NavLink>
        </span>
    );
}

function MainMenu() {
    return (
        <menu className="main-menu">
            <div className="main-menu__wrapper">
                <div className="main-menu__start-group">
                    <h2 className="main-menu__title">Smart Todo</h2>
                </div>
                <div className="main-menu__center-group">
                    <div className="main-menu__view-list">
                        <MenuItem name="List" to="/list" Icon={HiListBullet} />
                        <MenuItem name="Graph" to="/graph" Icon={DiGitBranch} />
                    </div>
                </div>
                <div className="main-menu__end-group">
                    <span className="main-menu__add-item">
                        <Link to="/addTask" className="main-menu__add-link">
                            <HiPlus className="main-menu__add-icon" />
                            <span className="main-menu__add-label">Add Task</span>
                        </Link>
                    </span>
                    <span className="main-menu__logout-wrapper">
                        <LogoutButton />
                    </span>
                </div>
            </div>
        </menu>
    );
}

export default MainMenu;
